import cv2
import time
import numpy as np

# import from modules
from emotion_analyzer import EmotionAnalyzer
from face_analyzer import FaceAnalyzer

class CriminalInvestigationSystem:
    def __init__(self):
        self.emotion_analyzer = EmotionAnalyzer()
        self.face_analyzer = FaceAnalyzer()
        
        # analysis settings
        self.emotion_interval = 1.0  # seconds between emotion analysis updates
        self.last_emotion_time = 0
        self.emotion = None
        self.emotion_confidence = 0
        
    def run_menu(self):
        """display main menu and handle user input"""
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
        """start investigation analysis"""
        
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
            
            # get screen dimensions for positioning the text
            screen_height, screen_width = face_frame.shape[:2]
            
            # create display frame
            display_frame = face_frame.copy()
            
            # if emotion is detected, overlay it prominently on frame
            if self.emotion and self.emotion != "Unknown":
                # display emotion name in large text
                cv2.putText(display_frame, f"Emotion: {self.emotion}", 
                        (int(screen_width*0.1), int(screen_height*0.1)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 3)
                
                # display confidence percentage for the dominant emotion
                if self.emotion in self.emotion_scores:
                    confidence = self.emotion_scores[self.emotion]
                    cv2.putText(display_frame, f"Confidence: {confidence:.1f}%", 
                            (int(screen_width*0.1), int(screen_height*0.2)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 3)
            
            # display frame
            cv2.imshow("Investigation Analysis", display_frame)
            
            # handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                running = False
            elif key == ord('r'):
                return_to_menu = True
                running = False
            elif key == ord('2'):  # to allow '2' key to exit
                running = False
            elif key == ord('f'):  # toggle fullscreen
                if cv2.getWindowProperty("Criminal Investigation Analysis", cv2.WND_PROP_FULLSCREEN) == cv2.WINDOW_FULLSCREEN:
                    cv2.setWindowProperty("Criminal Investigation Analysis", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                else:
                    cv2.setWindowProperty("Criminal Investigation Analysis", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        
        # release resources
        cap.release()
        cv2.destroyAllWindows()
        
        return return_to_menu

if __name__ == "__main__":
    system = CriminalInvestigationSystem()
    system.run_menu()