import { useState } from "react";
import {
  hasValidationErrors,
  validatePrice,
  validateRequiredText,
} from "../utils/validation";

const initialFormState = {
  title: "",
  price: "",
  category: "Electronics",
  location: "",
  sellerName: "",
  description: "",
  tags: "",
};

function SellItemForm({ onAddItem, onBack }) {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");

  const validateForm = (values) => ({
    title: validateRequiredText(values.title, "Item title", 3),
    price: validatePrice(values.price),
    location: validateRequiredText(values.location, "Pickup location", 3),
    sellerName: validateRequiredText(values.sellerName, "Seller name", 2),
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

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImagePreview("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
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
      location: formData.location.trim(),
      description: formData.description.trim(),
      image:
        imagePreview ||
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      seller: {
        name: formData.sellerName.trim(),
        status: "just posted",
      },
      isOwned: true,
      listingState: "active",
      messages: [
        {
          id: `seed-${Date.now()}`,
          sender: "seller",
          text: `Hi, this ${formData.title.trim()} is available. Feel free to ask anything.`,
          time: "Now",
        },
      ],
    };

    onAddItem(newItem);
    setFormData(initialFormState);
    setErrors({});
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

        <label className={errors.sellerName ? "form-field has-error" : "form-field"}>
          <span>Seller name</span>
          <input
            name="sellerName"
            value={formData.sellerName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Your full name"
            aria-invalid={Boolean(errors.sellerName)}
          />
          {errors.sellerName ? <small className="form-field-error">{errors.sellerName}</small> : null}
        </label>

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
          <button type="submit" className="primary-btn">
            Publish listing
          </button>
        </div>
      </form>
    </section>
  );
}

export default SellItemForm;
