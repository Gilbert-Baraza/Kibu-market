import { useEffect, useState } from "react";
import {
  hasValidationErrors,
  validatePrice,
  validateRequiredText,
} from "../utils/validation";

const initialFormState = {
  title: "",
  price: "",
  category: "Electronics",
  listingState: "active",
  location: "",
  description: "",
  tags: "",
};

function SellItemForm({ onAddItem, onBack, currentUser, isSubmitting = false }) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const validateForm = (values) => ({
    title: validateRequiredText(values.title, "Item title", 3),
    price: validatePrice(values.price),
    location: validateRequiredText(values.location, "Pickup location", 3),
    description: validateRequiredText(values.description, "Description", 20),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateForm({
        ...formData,
        [name]: value,
      })[name],
    }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: validateForm({
        ...formData,
        [name]: value,
      })[name],
    }));
  };

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview("");
      setImageFile(null);
      return;
    }

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(formData);

    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    const newItem = {
      title: formData.title.trim(),
      price: Number(formData.price),
      category: formData.category,
      listingState: formData.listingState,
      location: formData.location.trim(),
      description: formData.description.trim(),
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      seller: {
        id: currentUser.id,
        name: currentUser.name,
        status: "just posted",
        phone: currentUser.phone,
      },
    };

    const result = await onAddItem(newItem, imageFile);
    if (!result?.ok) {
      return;
    }

    setFormData(initialFormState);
    setErrors({});
    setImageFile(null);
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
  };

  return (
    <section className="sell-section" id="sell-form">
      <div className="section-heading sell-heading">
        <div>
          <span className="section-label">Sell on Kibu</span>
          <h2>Post an item in a minute</h2>
        </div>
        <p>
          Share the basics, add a photo link, and your listing appears instantly
          for nearby students to discover.
        </p>
      </div>

      <div className="sell-page-actions">
        <button type="button" className="secondary-btn" onClick={onBack}>
          Back to marketplace
        </button>
      </div>

      <form className="sell-form" onSubmit={handleSubmit}>
        <label className={errors.title ? "form-field form-field-wide has-error" : "form-field form-field-wide"}>
          <span>Item title</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="HP EliteBook, study chair, sneakers..."
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title ? <small className="form-field-error">{errors.title}</small> : null}
        </label>

        <label className={errors.price ? "form-field has-error" : "form-field"}>
          <span>Price (KES)</span>
          <input
            type="number"
            min="1"
            name="price"
            value={formData.price}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="2500"
            aria-invalid={Boolean(errors.price)}
          />
          {errors.price ? <small className="form-field-error">{errors.price}</small> : null}
        </label>

        <label className="form-field">
          <span>Category</span>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option>Electronics</option>
            <option>Books & Calculators</option>
            <option>Clothes & Shoes</option>
            <option>Beds & Bedding</option>
            <option>Furniture</option>
            <option>Accessories</option>
          </select>
        </label>

        <label className="form-field">
          <span>Listing status</span>
          <select name="listingState" value={formData.listingState} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
          </select>
        </label>

        <label className={errors.location ? "form-field has-error" : "form-field"}>
          <span>Pickup location</span>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Hostel B, main gate, admin block..."
            aria-invalid={Boolean(errors.location)}
          />
          {errors.location ? <small className="form-field-error">{errors.location}</small> : null}
        </label>

        <div className="form-field">
          <span>Seller account</span>
          <div className="form-readonly">
            <strong>{currentUser.name}</strong>
            <small>{currentUser.email}</small>
          </div>
        </div>

        <label className="form-field form-field-wide">
          <span>Upload image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        {imagePreview ? (
          <div className="image-upload-preview">
            <img src={imagePreview} alt="Listing preview" />
          </div>
        ) : null}

        <label className={errors.description ? "form-field form-field-wide has-error" : "form-field form-field-wide"}>
          <span>Description</span>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Condition, what is included, and why someone should grab it."
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description ? (
            <small className="form-field-error">{errors.description}</small>
          ) : null}
        </label>

        <label className="form-field form-field-wide">
          <span>Tags</span>
          <input
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="laptop, coding, hostel"
          />
        </label>

        <div className="sell-form-footer">
          <div className="sell-note">
            <strong>Tip</strong>
            <span>Clear photos and honest descriptions usually get faster replies.</span>
          </div>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish listing"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SellItemForm;
