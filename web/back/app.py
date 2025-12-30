from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2 import sql
import os
import re

# Base directory setup
# Current file: f:/database/web/back/app.py
# Static root: f:/database/web
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Serve Index
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

# Serve Static Files (CSS, JS, Images)
# Maps /front/... to f:/database/web/front/...
@app.route('/front/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(BASE_DIR, 'front'), path)

# Serve Public Files (Images)
# Maps /public/... to f:/database/web/public/...
@app.route('/public/<path:path>')
def serve_public(path):
    return send_from_directory(os.path.join(BASE_DIR, 'public'), path)

# Default database config
DB_HOST = "172.26.6.52"
DB_PORT = "5432"
DB_NAME = "postgres"

# Image directory
IMAGE_DIR = os.path.join(BASE_DIR, 'public')

def get_db_connection():
    # Using confirmed credentials 'remote_app_user'
    user = 'remote_app_user'
    password = 'User@123'
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"Connection failed: {e}")
        return None

# --- API Routes ---

@app.route('/api/animations', methods=['GET'])
def get_animations():
    """
    Returns list of animations with cover path and genres for hover effect.
    Joined with covers table and genres.
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "DB connection failed"}), 500

    try:
        cur = conn.cursor()
        # Fetch basic info + cover path
        # Also need genres. We can aggregate genres into a string.
        query = """
            SELECT 
                a.aid, 
                a.name, 
                a.season, 
                c.path as cover_path,
                STRING_AGG(g.name, ', ') as genres
            FROM public.Animation a
            LEFT JOIN public.covers c ON a.cover = c.cover
            LEFT JOIN public.GenreRelation gr ON a.aid = gr.aid
            LEFT JOIN public.Genre g ON gr.gid = g.gid
            GROUP BY a.aid, a.name, a.season, c.path
            ORDER BY a.aid
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        animations = []
        for row in rows:
            animations.append({
                "aid": row[0],
                "name": row[1],
                "season": row[2],
                "cover_path": row[3],
                "genres": row[4] or "未知"
            })
            
        cur.close()
        conn.close()
        return jsonify({"success": True, "data": animations}), 200
    except Exception as e:
        if conn: conn.close()
        print(e)
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/animation/<int:aid>', methods=['GET'])
def get_animation_detail(aid):
    """
    Get full details for an animation:
    - Info (intro, season, company)
    - Characters (name, image, voice actor, personality)
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({"success": False, "message": "Database connection error"}), 500

    try:
        cur = conn.cursor()
        
        # 1. Animation Info + Company + Genres
        # We can aggregate genres here or do a separate query. Let's do a separate query for clarity or join.
        # Let's add genres aggregation to the main query.
        query_info = """
            SELECT 
                a.name, a.introduction, a.season, 
                c.path as cover_path,
                co.name as company_name, co.president, co.address,
                STRING_AGG(DISTINCT g.name, ', ') as genres
            FROM public.Animation a
            LEFT JOIN public.covers c ON a.cover = c.cover
            LEFT JOIN public.ProductionInfo pi ON a.aid = pi.aid
            LEFT JOIN public.Company co ON pi.cyid = co.cyid
            LEFT JOIN public.GenreRelation gr ON a.aid = gr.aid
            LEFT JOIN public.Genre g ON gr.gid = g.gid
            WHERE a.aid = %s
            GROUP BY a.name, a.introduction, a.season, c.path, co.name, co.president, co.address
        """
        cur.execute(query_info, (aid,))
        info_row = cur.fetchone()
        
        if not info_row:
            return jsonify({"success": False, "message": "Animation not found"}), 404
            
        animation_data = {
            "name": info_row[0],
            "introduction": info_row[1],
            "season": info_row[2],
            "cover_path": info_row[3],
            "company": {
                "name": info_row[4],
                "president": info_row[5],
                "address": info_row[6]
            },
            "genres": info_row[7].split(', ') if info_row[7] else []
        }
        
        # 2. Characters + Voice Actors
        query_chars = """
            SELECT 
                ch.name, ch.sex, ch.personality,
                cov.path as char_cover,
                v.name as voice_actor, v.age as voice_actor_age
            FROM public.Characters ch
            LEFT JOIN public.covers cov ON ch.cover = cov.cover
            LEFT JOIN public.VoiceActor v ON ch.vid = v.vid
            WHERE ch.aid = %s
        """
        cur.execute(query_chars, (aid,))
        char_rows = cur.fetchall()
        
        characters = []
        for row in char_rows:
            characters.append({
                "name": row[0],
                "sex": row[1],
                "personality": row[2],
                "cover_path": row[3],
                "voice_actor": row[4],
                "voice_actor_age": row[5]
            })
            
        animation_data["characters"] = characters
        
        cur.close()
        conn.close()
        return jsonify({"success": True, "data": animation_data}), 200
        
    except Exception as e:
        if conn: conn.close()
        print(e)
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
