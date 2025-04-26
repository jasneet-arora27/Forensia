import cv2
import time
import numpy as np
import json
import os
from datetime import datetime

# import from modules
from emotion_analyzer import EmotionAnalyzer
from face_analyzer import FaceAnalyzer
from gesture_analyzer import GestureAnalyzer 

class CriminalInvestigationSystem:
    def __init__(self):
        self.emotion_analyzer = EmotionAnalyzer()
        self.face_analyzer = FaceAnalyzer()
        self.gesture_analyzer = GestureAnalyzer()

        # analysis settings
        self.emotion_interval = 1.0  # seconds between emotion analysis updates
        self.last_emotion_time = 0
        self.emotion = None
        self.emotion_scores = {}
        
        # create data directory if it doesn't exist
        self.data_dir = "session_data"
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def run_menu(self):
        """display main menu and handle user input."""
        while True:
            print("1: Start Analysis\n2: View Past Sessions\n3: Exit")
            key = input("Select an option: ")

            if key == '1':
                return_to_menu = self.start_analysis()
                if not return_to_menu:
                    break
            elif key == '2':
                self.view_past_sessions()
            elif key == '3':
                break
            else:
                continue

    def start_analysis(self):
        """start investigation analysis."""
        # create session file at start
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_file = os.path.join(self.data_dir, f"session_{timestamp}.json")
        
        # initialize session data
        session_data = {
            "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": None,
            "duration": None,
            "frames": []  # will store frames saved when 's' is pressed
        }
        
        # write initial session file
        with open(session_file, 'w') as file:
            json.dump(session_data, file, indent=4)
        
        session_start_time = time.time()
        print(f"Session started at: {session_data['start_time']}")
        print(f"Session file created: {session_file}")

        # start video capture
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Cannot open camera")
            return True

        return_to_menu = False
        running = True
        frames_saved = 0

        # create named window and set to fullscreen immediately
        cv2.namedWindow("Investigation Analysis", cv2.WINDOW_NORMAL)
        cv2.setWindowProperty("Investigation Analysis", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

        while running:
            # capture frame
            ret, frame = cap.read()
            if not ret:
                print("Can't receive frame. Exiting...")
                break

            # process emotions at intervals
            current_time = time.time()
            if current_time - self.last_emotion_time >= self.emotion_interval:
                self.emotion, self.emotion_scores = self.emotion_analyzer.analyze(frame)
                self.last_emotion_time = current_time

            # process face
            face_frame, face_detected = self.face_analyzer.analyze(frame)

            # process gesture
            gesture_frame, gestures = self.gesture_analyzer.analyze(face_frame)

            # create display frame
            display_frame = gesture_frame

            # get screen dimensions for positioning the text
            screen_height, screen_width = display_frame.shape[:2]

            # if emotion is detected, overlay it prominently on frame
            if self.emotion and self.emotion != "Unknown":
                # display dominant emotion in large text
                cv2.putText(display_frame, f"Dominant Emotion: {self.emotion} ({self.emotion_scores[self.emotion]:.1f}%)",
                            (int(screen_width * 0.1), int(screen_height * 0.1)),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)

                # display all emotions with their percentages
                y_offset_emotions = int(screen_height * 0.2)  # start below the dominant emotion
                for emotion, score in self.emotion_scores.items():
                    cv2.putText(display_frame, f"{emotion.capitalize()}: {score:.1f}%",
                                (int(screen_width * 0.1), y_offset_emotions),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (10, 10, 10), 2)
                    y_offset_emotions += 30  # increment for the next emotion

            # display gestures
            if gestures:
                y_offset_gestures = y_offset_emotions + 50  # start below the emotions section
                for gesture in gestures:
                    cv2.putText(display_frame, f"Gesture: {gesture}",
                                (int(screen_width * 0.1), y_offset_gestures),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (50, 50, 50), 2)
                    y_offset_gestures += 30  # increment for the next gesture
            
            # display saved frames count
            cv2.putText(display_frame, f"Frames saved: {frames_saved}",
                        (int(screen_width * 0.1), int(screen_height * 0.85)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            # display session instructions
            cv2.putText(display_frame, "Press 'q' to end session, 's' to save current frame",
                        (int(screen_width * 0.1), int(screen_height * 0.95)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # display frame
            cv2.imshow("Investigation Analysis", display_frame)

            # handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):  # quit analysis
                running = False
                self.finalize_session(session_file, session_start_time)
            elif key == ord('r'):  # return to menu
                return_to_menu = True
                running = False
                self.finalize_session(session_file, session_start_time)
            elif key == ord('s'):  # save current frame data
                frames_saved += 1
                self.save_frame_data(session_file, current_time - session_start_time, 
                                    self.emotion, self.emotion_scores, gestures)
            elif key == ord('f'):  # toggle fullscreen
                current_prop = cv2.getWindowProperty("Investigation Analysis", cv2.WND_PROP_FULLSCREEN)
                new_prop = cv2.WINDOW_NORMAL if current_prop == cv2.WINDOW_FULLSCREEN else cv2.WINDOW_FULLSCREEN
                cv2.setWindowProperty("Investigation Analysis", cv2.WND_PROP_FULLSCREEN, new_prop)

        cap.release()
        cv2.destroyAllWindows()
        return return_to_menu
    
    def save_frame_data(self, session_file, timestamp, emotion, emotion_scores, gestures):
        """Save current frame data to the session file"""
        # read current session file
        with open(session_file, 'r') as file:
            session_data = json.load(file)
        
        # format timestamp for display
        time_str = f"{int(timestamp // 60):02d}:{int(timestamp % 60):02d}"
        
        # create frame data with current information
        frame_data = {
            "timestamp": timestamp,
            "time_str": time_str,
            "emotion": None,
            "gestures": None
        }
        
        # add emotion data if available
        if emotion and emotion != "Unknown":
            frame_data["emotion"] = {
                "dominant": emotion,
                "scores": emotion_scores
            }
        
        # add gesture data
        if gestures:
            frame_data["gestures"] = gestures
        
        # append this frame to the saved frames
        session_data["frames"].append(frame_data)
        
        # write updated data back to file
        with open(session_file, 'w') as file:
            json.dump(session_data, file, indent=4)
        
        print(f"Saved frame at {time_str} to {session_file}")
    
    def finalize_session(self, session_file, start_time):
        """Update the session file with end time and duration"""
        if not os.path.exists(session_file):
            return
            
        end_time = time.time()
        duration = end_time - start_time
        
        # read current session file
        with open(session_file, 'r') as file:
            session_data = json.load(file)
        
        # update session data
        session_data["end_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        session_data["duration"] = duration
        
        # write updated data back to file
        with open(session_file, 'w') as file:
            json.dump(session_data, file, indent=4)
            
        print(f"Session completed and saved to {session_file}")
        print(f"Session duration: {int(duration // 60):02d}:{int(duration % 60):02d}")
    
    def view_past_sessions(self):
        """View list of past sessions and allow user to select one to view details"""
        session_files = [f for f in os.listdir(self.data_dir) if f.endswith('.json')]
        
        if not session_files:
            print("No saved sessions found.")
            input("Press Enter to continue...")
            return
        
        print("\nSaved Sessions:")
        for i, file in enumerate(session_files):
            print(f"{i+1}: {file}")
        
        choice = input("\nEnter session number to view (or press Enter to go back): ")
        if not choice:
            return
        
        try:
            index = int(choice) - 1
            if 0 <= index < len(session_files):
                self.display_session_data(session_files[index])
            else:
                print("Invalid session number.")
        except ValueError:
            print("Invalid input.")
        
        input("Press Enter to continue...")
    
    def display_session_data(self, filename):
        """Display detailed session data"""
        filepath = os.path.join(self.data_dir, filename)
        
        try:
            with open(filepath, 'r') as file:
                session_data = json.load(file)
                
            print("\n" + "="*50)
            print(f"Session Data: {filename}")
            print("="*50)
            print(f"Start Time: {session_data['start_time']}")
            print(f"End Time: {session_data.get('end_time', 'Not finished')}")
            
            if session_data.get('duration'):
                duration = session_data['duration']
                minutes = int(duration // 60)
                seconds = int(duration % 60)
                print(f"Duration: {minutes:02d}:{seconds:02d}")
            
            # display saved frames
            frames = session_data.get('frames', [])
            print(f"\nTotal Frames Saved: {len(frames)}")
            
            for i, frame in enumerate(frames):
                print(f"\nFrame {i+1} - Time: {frame.get('time_str', 'N/A')}")
                
                # display emotion data
                if frame.get('emotion'):
                    print(f"  Emotion: {frame['emotion']['dominant']} "
                          f"({frame['emotion']['scores'][frame['emotion']['dominant']]:.1f}%)")
                    
                # display gesture data
                if frame.get('gestures'):
                    gesture_str = ", ".join(str(g) for g in frame['gestures'])
                    print(f"  Gestures: {gesture_str}")
                
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error reading session file: {e}")

if __name__ == "__main__":
    system = CriminalInvestigationSystem()
    system.run_menu()