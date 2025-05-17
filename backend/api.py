import os
import json
import time
import base64
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv

# import existing classes from app
from app.analyzers import EmotionAnalyzer, FaceAnalyzer, GestureAnalyzer
from app.managers import SessionManager, ReportManager

# load environment variables
load_dotenv()

# initialize Flask app
app = Flask(__name__)
CORS(app)  # enable CORS for all routes

# initialize analyzers and managers
emotion_analyzer = EmotionAnalyzer()
face_analyzer = FaceAnalyzer()
gesture_analyzer = GestureAnalyzer()
session_manager = SessionManager()
report_manager = ReportManager()

# store active sessions
active_sessions = {}

@app.route('/api/sessions/start', methods=['POST'])
def start_session():
    """Start a new analysis session"""
    try:
        session_file, start_time = session_manager.create_session()
        session_id = os.path.basename(session_file).replace('session_', '').replace('.json', '')
        
        # store session info
        active_sessions[session_id] = {
            'session_file': session_file,
            'start_time': start_time,
            'last_emotion_time': 0,
            'emotion': None,
            'emotion_scores': {},
            'frames_saved': 0
        }
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'start_time': datetime.fromtimestamp(start_time).strftime('%Y-%m-%d %H:%M:%S')
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sessions/<session_id>/analyze', methods=['POST'])
def analyze_frame(session_id):
    """Analyze a frame from the frontend"""
    if session_id not in active_sessions:
        return jsonify({'success': False, 'error': 'Session not found'}), 404
    
    try:
        # get session info
        session_info = active_sessions[session_id]
        
        # get frame data from request
        if 'frame' not in request.json:
            return jsonify({'success': False, 'error': 'No frame data provided'}), 400
        
        # decode base64 image
        encoded_frame = request.json['frame'].split(',')[1] if ',' in request.json['frame'] else request.json['frame']
        nparr = np.frombuffer(base64.b64decode(encoded_frame), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # get current time
        current_time = time.time()
        
        # process emotions at intervals
        emotion = session_info['emotion']
        emotion_scores = session_info['emotion_scores']
        
        if current_time - session_info['last_emotion_time'] >= 1.0:  # 1 second intervals
            emotion, emotion_scores = emotion_analyzer.analyze(frame)
            session_info['emotion'] = emotion
            session_info['emotion_scores'] = emotion_scores
            session_info['last_emotion_time'] = current_time
        
        # process face
        face_frame, face_detected = face_analyzer.analyze(frame)
        
        # process gesture
        _, gestures = gesture_analyzer.analyze(face_frame)
        
        # create response data
        response_data = {
            'success': True,
            'emotion': {
                'dominant': emotion if emotion and emotion != "Unknown" else None,
                'scores': emotion_scores if emotion and emotion != "Unknown" else {}
            },
            'face_detected': face_detected,
            'gestures': gestures if gestures else [],
            'timestamp': current_time - session_info['start_time'],
            'time_str': f"{int((current_time - session_info['start_time']) // 60):02d}:{int((current_time - session_info['start_time']) % 60):02d}"
        }
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sessions/<session_id>/save-frame', methods=['POST'])
def save_frame(session_id):
    """Save the current frame data to the session"""
    if session_id not in active_sessions:
        return jsonify({'success': False, 'error': 'Session not found'}), 404
    
    try:
        # get session info
        session_info = active_sessions[session_id]
        
        # get data from request
        data = request.json
        
        # get current time
        current_time = time.time()
        elapsed_time = current_time - session_info['start_time']
        
        # save frame data
        frames_saved = session_manager.save_frame_data(
            session_info['session_file'],
            elapsed_time,
            data.get('emotion', {}).get('dominant'),
            data.get('emotion', {}).get('scores', {}),
            data.get('gestures', [])
        )
        
        session_info['frames_saved'] = frames_saved
        
        return jsonify({
            'success': True,
            'frames_saved': frames_saved
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sessions/<session_id>/end', methods=['POST'])
def end_session(session_id):
    """End an analysis session and generate a report"""
    if session_id not in active_sessions:
        return jsonify({'success': False, 'error': 'Session not found'}), 404
    
    try:
        # get session info
        session_info = active_sessions[session_id]
        
        # finalize session
        report_file = session_manager.finalize_session(
            session_info['session_file'],
            session_info['start_time']
        )
        
        # remove session from active sessions
        del active_sessions[session_id]
        
        return jsonify({
            'success': True,
            'report': os.path.basename(report_file) if report_file else None
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    """List all available sessions"""
    try:
        sessions = session_manager.list_sessions()
        
        # get session details
        session_details = []
        for session_file in sessions:
            try:
                with open(os.path.join(session_manager.data_dir, session_file), 'r') as f:
                    session_data = json.load(f)
                    
                session_id = session_file.replace('session_', '').replace('.json', '')
                session_details.append({
                    'id': session_id,
                    'filename': session_file,
                    'start_time': session_data.get('start_time'),
                    'end_time': session_data.get('end_time'),
                    'duration': session_data.get('duration'),
                    'frames_count': len(session_data.get('frames', []))
                })
            except Exception as e:
                print(f"Error reading session file {session_file}: {e}")
        
        return jsonify({
            'success': True,
            'sessions': session_details
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session_data(session_id):
    """Get detailed data for a specific session"""
    try:
        session_file = f"session_{session_id}.json"
        filepath = os.path.join(session_manager.data_dir, session_file)
        
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        with open(filepath, 'r') as f:
            session_data = json.load(f)
        
        return jsonify({
            'success': True,
            'session': {
                'id': session_id,
                'filename': session_file,
                'data': session_data
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def list_reports():
    """List all available reports"""
    try:
        reports = [f for f in os.listdir(report_manager.reports_dir) if f.endswith('.json')]
        
        # get report details
        report_details = []
        for report_file in reports:
            try:
                report_id = report_file.replace('report_', '').replace('.json', '')
                
                # check if corresponding session exists
                session_file = f"session_{report_id}.json"
                session_path = os.path.join(session_manager.data_dir, session_file)
                
                session_info = {}
                if os.path.exists(session_path):
                    with open(session_path, 'r') as f:
                        session_data = json.load(f)
                        session_info = {
                            'start_time': session_data.get('start_time'),
                            'end_time': session_data.get('end_time'),
                            'duration': session_data.get('duration')
                        }
                
                report_details.append({
                    'id': report_id,
                    'filename': report_file,
                    'session_info': session_info
                })
            except Exception as e:
                print(f"Error reading report file {report_file}: {e}")
        
        return jsonify({
            'success': True,
            'reports': report_details
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report_data(report_id):
    """Get content of a specific report"""
    try:
        report_file = f"report_{report_id}.json"
        filepath = os.path.join(report_manager.reports_dir, report_file)
        
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'Report not found'}), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            report_data = json.load(f)
        
        return jsonify({
            'success': True,
            'report': {
                'id': report_id,
                'filename': report_file,
                'content': report_data
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)