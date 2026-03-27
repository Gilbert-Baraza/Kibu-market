import { useState } from "react";

const initialFormState = {
  title: "",
  price: "",
  category: "Electronics",
  location: "",
  sellerName: "",
  description: "",
  image: "",
  tags: "",
};

function SellItemForm({ onAddItem, onBack }) {
  const [formData, setFormData] = useState(initialFormState);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const newItem = {
      title: formData.title.trim(),
      price: Number(formData.price),
      category: formData.category,
      location: formData.location.trim(),
      description: formData.description.trim(),
      image:
        formData.image.trim() ||
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      seller: {
        name: formData.sellerName.trim(),
        status: "just posted",
      },
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
    setSuccessMessage(`${newItem.title} is now live in the marketplace.`);
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
        <label className="form-field form-field-wide">
          <span>Item title</span>
          <input
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="HP EliteBook, study chair, sneakers..."
          />
        </label>

        <label className="form-field">
          <span>Price (KES)</span>
          <input
            required
            type="number"
            min="1"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="2500"
          />
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
          <span>Pickup location</span>
          <input
            required
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Hostel B, main gate, admin block..."
          />
        </label>

        <label className="form-field">
          <span>Seller name</span>
          <input
            required
            name="sellerName"
            value={formData.sellerName}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Image URL</span>
          <input
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/item-photo.jpg"
          />
        </label>

        <label className="form-field form-field-wide">
          <span>Description</span>
          <textarea
            required
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Condition, what is included, and why someone should grab it."
          />
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

        {successMessage ? <p className="form-success">{successMessage}</p> : null}
      </form>
    </section>
  );
}

export default SellItemForm;
