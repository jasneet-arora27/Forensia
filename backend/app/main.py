import cv2
import time
import numpy as np

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

    def run_menu(self):
        """display main menu and handle user input."""
        while True:
            # display a simple message in place of menu
            print("1: Start Analysis\n2: Exit")
            
            # handle key presses
            key = input("Select an option: ")

            if key == '1':
                return_to_menu = self.start_analysis()
                if not return_to_menu:
                    break
            elif key == '2':
                break
            else:
                continue

    def start_analysis(self):
        """start investigation analysis."""

        # start video capture
        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            print("Cannot open camera")
            return True

        return_to_menu = False
        running = True

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

            # create display frame (assign it after processing gesture)
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
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (50, 50, 50), 1)
                    y_offset_gestures += 30  # increment for the next gesture

            # display frame
            cv2.imshow("Investigation Analysis", display_frame)

            # handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):  # quit analysis
                running = False
            elif key == ord('r'):  # return to menu
                return_to_menu = True
                running = False
            elif key == ord('2'):  # exit
                running = False
            elif key == ord('f'):  # toggle fullscreen
                current_prop = cv2.getWindowProperty("Investigation Analysis", cv2.WND_PROP_FULLSCREEN)
                new_prop = cv2.WINDOW_NORMAL if current_prop == cv2.WINDOW_FULLSCREEN else cv2.WINDOW_FULLSCREEN
                cv2.setWindowProperty("Investigation Analysis", cv2.WND_PROP_FULLSCREEN, new_prop)

        cap.release()
        cv2.destroyAllWindows()

        return return_to_menu

if __name__ == "__main__":
    system = CriminalInvestigationSystem()
    system.run_menu()
