const phonePattern = /^(?:\+254|254|0)(?:1|7)\d{8}$/;

function isBlank(value) {
  return String(value ?? "").trim().length === 0;
}

export function validateRequiredText(value, label, minLength = 1) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return `${label} is required.`;
  }

  if (normalizedValue.length < minLength) {
    return `${label} should be at least ${minLength} characters.`;
  }

  return "";
}

export function validatePrice(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "Price is required.";
  }

  if (!/^\d+$/.test(normalizedValue)) {
    return "Price must be a whole number in KES.";
  }

  const amount = Number(normalizedValue);

  if (amount < 1) {
    return "Price must be greater than zero.";
  }

  if (amount > 100000) {
    return "Price looks too high. Please enter a realistic amount.";
  }

  return "";
}

export function validatePhone(value) {
  const normalizedValue = String(value ?? "").replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  if (!phonePattern.test(normalizedValue)) {
    return "Use a valid Kenyan phone number like 0700123456 or +254700123456.";
  }

  return "";
}

export function validateEmail(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some((message) => !isBlank(message));
}

export function scrollToFirstValidationError(container) {
  if (!container) {
    return;
  }

  window.requestAnimationFrame(() => {
    const firstInvalidField = container.querySelector(
      '[aria-invalid="true"], .auth-input-error, .has-error input, .has-error textarea, .has-error select, .has-error',
    );

    if (!(firstInvalidField instanceof HTMLElement)) {
      return;
    }

    firstInvalidField.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    const focusTarget = firstInvalidField.matches("input, textarea, select, button")
      ? firstInvalidField
      : firstInvalidField.querySelector("input, textarea, select, button");

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
  });
}
