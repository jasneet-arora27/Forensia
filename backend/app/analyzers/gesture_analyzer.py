import cv2
import mediapipe as mp

class GestureAnalyzer:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
        self.mp_drawing = mp.solutions.drawing_utils
        self.gesture_history = []

    def analyze(self, frame):
        """Analyze hand gestures in a frame."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)

        gestures = []
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # extract hand landmarks
                landmarks = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_landmarks.landmark]
                gestures.append({"landmarks": landmarks})

                # draw hand landmarks on the frame
                self.mp_drawing.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)

        # save gestures to history (limit to last 50 entries)
        self.gesture_history.append(gestures)
        if len(self.gesture_history) > 50:
            self.gesture_history.pop(0)

        return frame, gestures