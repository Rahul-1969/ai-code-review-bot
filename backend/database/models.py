import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base

class Review(Base):
    __tablename__ = 'reviews'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # Likely ForeignKey('users.id')
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    code = Column(Text)
    response = Column(Text)

    feedbacks = relationship("Feedback", back_populates="review")


class Feedback(Base):
    __tablename__ = 'feedbacks'

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey('reviews.id'))
    accepted = Column(Boolean)
    reason = Column(Text)
    timestamp = Column(DateTime)

    review = relationship("Review", back_populates="feedbacks")


class Pattern(Base):
    __tablename__ = 'patterns'

    id = Column(Integer, primary_key=True, index=True)
    pattern_type = Column(String, index=True)
    pattern_name = Column(String, index=True)
    score = Column(Float)
    confidence = Column(Float)
