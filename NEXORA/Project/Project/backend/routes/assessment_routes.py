import logging
from flask import Blueprint, request, jsonify

from models.assessment_model import save_assessment, get_history_for_user

assessment_bp = Blueprint('assessment_bp', __name__)


@assessment_bp.route('', methods=['POST'])
def create_assessment():
    data = request.get_json(silent=True) or {}

    user_id = data.get('user_id')
    phq_score = data.get('phq_score')
    phq_severity = data.get('phq_severity')
    lifestyle_risk = data.get('lifestyle_risk')

    if user_id is None or phq_score is None or not phq_severity or not lifestyle_risk:
        return jsonify({
            'status': 'error',
            'message': 'Missing required assessment fields.',
            'received': data
        }), 400

    try:
        save_assessment(user_id, int(phq_score), phq_severity, lifestyle_risk)
    except Exception as err:
        logging.error(f"Error saving assessment: {err}")
        return jsonify({'status': 'error', 'message': str(err)}), 500

    return jsonify({'status': 'success', 'message': 'Assessment result saved successfully.'}), 201


@assessment_bp.route('/history', methods=['GET'])
def assessment_history():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id parameter is required.'}), 400

    try:
        history = get_history_for_user(user_id)
    except Exception as err:
        logging.error(f"Error retrieving history for user {user_id}: {err}")
        return jsonify({'status': 'error', 'message': str(err)}), 500

    return jsonify({'status': 'success', 'history': history}), 200