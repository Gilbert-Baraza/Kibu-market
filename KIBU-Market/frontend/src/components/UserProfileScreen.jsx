import { useEffect, useState } from "react";
import {
  hasValidationErrors,
  validateEmail,
  validatePhone,
  validateRequiredText,
} from "../utils/validation";

const emptyProfile = {
  name: "Campus Seller",
  email: "seller@kibu.ac.ke",
  phone: "0700 000 000",
  campus: "Kibabii University",
  bio: "Student seller sharing useful finds, study essentials, and room upgrades around campus.",
};

function UserProfileScreen({
  products,
  savedItems,
  userProfile,
  onBack,
  onUpdateProfile,
  onViewListing,
}) {
  const [formData, setFormData] = useState(userProfile ?? emptyProfile);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(userProfile ?? emptyProfile);
  }, [userProfile]);

  const validateProfileForm = (values) => ({
    name: validateRequiredText(values.name, "Full name", 2),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    campus: validateRequiredText(values.campus, "Campus", 2),
    bio: validateRequiredText(values.bio, "Bio", 20),
  });

  const savedProducts = products.filter((product) => savedItems.includes(product.id));
  const postedProducts = products.filter((product) => product.isOwned);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setErrors((current) => ({
      ...current,
      [name]: validateProfileForm({
        ...formData,
        [name]: value,
      })[name],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateProfileForm(formData);

    setErrors(nextErrors);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    onUpdateProfile(formData);
  };

  return (
    <section className="profile-screen">
      <div className="messages-header">
        <div>
          <span className="section-label">Account</span>
          <h2>My profile</h2>
        </div>
        <button type="button" className="secondary-btn" onClick={onBack}>
          Back to marketplace
        </button>
      </div>

      <div className="profile-layout">
        <div className="profile-panel">
          <div className="profile-summary">
            <span className="profile-avatar">
              {formData.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <h3>{formData.name}</h3>
              <p>{formData.campus}</p>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            <label className={errors.name ? "form-field has-error" : "form-field"}>
              <span>Full name</span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <small className="form-field-error">{errors.name}</small> : null}
            </label>

            <label className={errors.email ? "form-field has-error" : "form-field"}>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <small className="form-field-error">{errors.email}</small> : null}
            </label>

            <label className={errors.phone ? "form-field has-error" : "form-field"}>
              <span>Phone</span>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0700123456"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <small className="form-field-error">{errors.phone}</small> : null}
            </label>

            <label className={errors.campus ? "form-field has-error" : "form-field"}>
              <span>Campus</span>
              <input
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                aria-invalid={Boolean(errors.campus)}
              />
              {errors.campus ? <small className="form-field-error">{errors.campus}</small> : null}
            </label>

            <label className={errors.bio ? "form-field form-field-wide has-error" : "form-field form-field-wide"}>
              <span>Bio</span>
              <textarea
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                aria-invalid={Boolean(errors.bio)}
              />
              {errors.bio ? <small className="form-field-error">{errors.bio}</small> : null}
            </label>

            <button type="submit" className="primary-btn profile-save-btn">
              Save profile
            </button>
          </form>
        </div>

        <div className="profile-sections">
          <section className="profile-panel">
            <div className="profile-section-heading">
              <span className="section-label">Saved items</span>
              <h3>{savedProducts.length} saved</h3>
            </div>
            <div className="profile-item-list">
              {savedProducts.length > 0 ? (
                savedProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="profile-item-card"
                    onClick={() => onViewListing(product)}
                  >
                    <img src={product.image} alt={product.title} className="profile-item-image" />
                    <div className="profile-item-copy">
                      <strong>{product.title}</strong>
                      <span>KES {product.price.toLocaleString()}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="profile-empty-copy">Saved items will appear here.</p>
              )}
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-section-heading">
              <span className="section-label">Posted items</span>
              <h3>{postedProducts.length} listings</h3>
            </div>
            <div className="profile-item-list">
              {postedProducts.length > 0 ? (
                postedProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="profile-item-card"
                    onClick={() => onViewListing(product)}
                  >
                    <img src={product.image} alt={product.title} className="profile-item-image" />
                    <div className="profile-item-copy">
                      <strong>{product.title}</strong>
                      <span>{product.listingState === "sold" ? "Sold" : "Active"}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="profile-empty-copy">Your posted listings will appear here.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default UserProfileScreen;
