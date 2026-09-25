from flask import Blueprint, jsonify

from models.admin_model import list_psychologists


psychologist_bp = Blueprint('psychologist', __name__)


@psychologist_bp.route('/psychologists', methods=['GET'])
def get_public_psychologists():
    try:
        return jsonify({'status': 'success', 'psychologists': list_psychologists()}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500
