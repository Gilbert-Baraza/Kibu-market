import { useState } from "react";
import StarRating from "./StarRating";
import "./RatingModal.css";

export default function RatingModal({
  sellerName,
  listingTitle,
  onSubmit,
  onClose,
  isLoading = false,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    await onSubmit({ rating, comment: comment.trim() });
  };

  return (
    <div
      className="rating-modal-overlay"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <div
        className="rating-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
      >
        <button
          type="button"
          className="rating-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          X
        </button>

        <div className="rating-modal-header">
          <h2 id="rating-modal-title">Rate your experience</h2>
          <p className="rating-modal-context">
            How was your interaction with <strong>{sellerName}</strong> about{" "}
            <em>{listingTitle}</em>?
          </p>
        </div>

        <div className="rating-modal-body">
          <div className="rating-stars-section">
            <label className="rating-label">Your rating</label>
            <StarRating
              value={rating}
              onChange={setRating}
              size="large"
            />
          </div>

          <div className="rating-comment-section">
            <label htmlFor="rating-comment" className="rating-label">
              Leave a comment <span className="optional-label">(optional)</span>
            </label>
            <textarea
              id="rating-comment"
              className="rating-textarea"
              placeholder="Share details about your experience..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={3}
            />
            <span className="char-count">{comment.length}/500</span>
          </div>
        </div>

        <div className="rating-modal-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
          >
            {isLoading ? "Submitting..." : "Submit rating"}
          </button>
        </div>
      </div>
    </div>
  );
}
