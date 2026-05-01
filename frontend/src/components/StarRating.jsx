import { useState } from "react";
import "./StarRating.css";

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = "medium",
  showValue = false,
  className = "",
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (starValue) => {
    if (!readonly && onChange) {
      onChange(starValue);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (!readonly) {
      setHoverValue(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  const sizeClass = `star-rating--${size}`;

  return (
    <div className={`star-rating ${sizeClass} ${className}`}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          className={`star ${readonly ? "star--readonly" : "star--interactive"} ${displayValue >= starValue ? "star--filled" : ""}`}
          onClick={() => handleClick(starValue)}
          onMouseEnter={() => handleMouseEnter(starValue)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          aria-label={`Rate ${starValue} out of 5 stars`}
          aria-current={readonly ? `${value} stars` : undefined}
        >
          ★
        </button>
      ))}
      {showValue && (
        <span className="star-rating__value">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
