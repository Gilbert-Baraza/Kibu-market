import StarRating from "./StarRating";

export default function SellerRatingBadge({
  average = 0,
  count = 0,
  size = "small"
}) {
  // Don't show anything if no reviews
  if (count === 0) {
    return null;
  }

  return (
    <div className="seller-rating-badge" title={`${average.toFixed(1)} stars from ${count} ${count === 1 ? 'review' : 'reviews'}`}>
      <StarRating
        value={average}
        readonly
        size={size}
      />
      <span className="rating-count">({count})</span>
    </div>
  );
}
