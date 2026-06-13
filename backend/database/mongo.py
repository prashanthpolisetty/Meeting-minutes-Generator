"""
MongoDB Connection Setup
Establishes a connection to the MongoDB server using PyMongo.
"""

from pymongo import MongoClient
import logging
from backend.config.settings import settings

logger = logging.getLogger(__name__)

# Global variables for caching the client connection
client = None
db = None

def get_db():
    """Returns the MongoDB database instance."""
    global client, db
    if client is None:
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}")
            client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
            # Verify the connection via a quick ping
            client.admin.command('ping')
            db = client[settings.DATABASE_NAME]
            logger.info(f"Successfully connected to MongoDB database: {settings.DATABASE_NAME}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e
    return db
