from functools import wraps

from flask import Blueprint, jsonify, request, session

from models.admin_model import (
    create_psychologist,
    delete_psychologist,
    delete_user,
    list_psychologists,
    list_users_with_latest_assessment,
    update_psychologist,
)
from models.user_model import find_user_by_id


admin_bp = Blueprint('admin', __name__)


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'status': 'error', 'message': 'Administrator authentication required.'}), 401

        try:
            user = find_user_by_id(user_id)
        except Exception as err:
            return jsonify({'status': 'error', 'message': str(err)}), 500

        if not user or not bool(user.get('is_admin')):
            return jsonify({'status': 'error', 'message': 'Administrator access required.'}), 403
        return view(*args, **kwargs)

    return wrapped


@admin_bp.route('/psychologists', methods=['GET'])
@admin_required
def get_psychologists():
    try:
        return jsonify({'status': 'success', 'psychologists': list_psychologists()}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500


@admin_bp.route('/psychologists', methods=['POST'])
@admin_required
def add_psychologist():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    specialization = (data.get('specialization') or '').strip()
    if not name or not specialization:
        return jsonify({'status': 'error', 'message': 'Name and specialization are required.'}), 400
    if len(name) > 150 or len(specialization) > 150:
        return jsonify({'status': 'error', 'message': 'Name and specialization are too long.'}), 400

    data['name'] = name
    data['specialization'] = specialization
    try:
        psychologist_id = create_psychologist(data)
        return jsonify({'status': 'success', 'id': psychologist_id}), 201
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500


@admin_bp.route('/psychologists/<int:psychologist_id>', methods=['DELETE'])
@admin_required
def remove_psychologist(psychologist_id):
    try:
        if not delete_psychologist(psychologist_id):
            return jsonify({'status': 'error', 'message': 'Psychologist not found.'}), 404
        return jsonify({'status': 'success', 'message': 'Psychologist removed.'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    try:
        return jsonify({'status': 'success', 'users': list_users_with_latest_assessment()}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def remove_user(user_id):
    try:
        if not delete_user(user_id):
            return jsonify({'status': 'error', 'message': 'Patient not found.'}), 404
        return jsonify({'status': 'success', 'message': 'Patient record removed.'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500


@admin_bp.route('/psychologists/<int:psychologist_id>', methods=['PUT'])
@admin_required
def edit_psychologist(psychologist_id):
    data = request.get_json(silent=True) or {}
    data['name'] = (data.get('name') or '').strip()
    data['specialization'] = (data.get('specialization') or '').strip()
    if not data['name'] or not data['specialization']:
        return jsonify({'status': 'error', 'message': 'Name and specialization are required.'}), 400
    try:
        if not update_psychologist(psychologist_id, data):
            return jsonify({'status': 'error', 'message': 'Psychologist not found.'}), 404
        return jsonify({'status': 'success', 'message': 'Psychologist updated.'}), 200
    except Exception as err:
        return jsonify({'status': 'error', 'message': str(err)}), 500