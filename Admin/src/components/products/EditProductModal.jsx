import React, { useState, useEffect } from "react";
import axios from "axios";
import { showToast } from "../ToastProvider";
import { X } from "lucide-react";

const EditProductModal = ({ isOpen, onClose, product, onProductUpdated }) => {
  const [productData, setProductData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    inventory: "",
    size: "XL",
    status: "",
    categoryId: "",
    brandId: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (isOpen && product) {
      setProductData({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        inventory: product.inventory,
        size: product.size || "XL",
        status: product.status,
        categoryId: product.categoryId,
        brandId: product.brandId,
      });
    }
  }, [isOpen, product]);

  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          axios.get("http://localhost:8080/tirashop/category"),
          axios.get("http://localhost:8080/tirashop/brand"),
        ]);
        setCategories(
          Array.isArray(categoriesResponse.data.data.elementList) ? categoriesResponse.data.data.elementList : []
        );
        setBrands(
          Array.isArray(brandsResponse.data.data.elementList) ? brandsResponse.data.data.elementList : []
        );
      } catch (err) {
        console.error("Error fetching categories or brands:", err);
        showToast("Failed to load categories or brands.", "error");
      }
    };

    if (isOpen) fetchCategoriesAndBrands();
  }, [isOpen]);

  const handleChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedProductData = {
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        originalPrice: parseFloat(productData.originalPrice),
        inventory: parseInt(productData.inventory),
        size: productData.size,
        status: productData.status,
        categoryId: Number(productData.categoryId),
        brandId: Number(productData.brandId),
      };

      const productResponse = await axios.put(
        `http://localhost:8080/tirashop/product/update/${productData.id}`,
        updatedProductData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // ✅ Lấy product vừa update từ server
      const updatedProduct = productResponse.data.data;

      // ✅ Gán brandName & categoryName thủ công từ danh sách đã fetch
      const selectedBrand = brands.find(b => b.id === Number(productData.brandId));
      const selectedCategory = categories.find(c => c.id === Number(productData.categoryId));

      updatedProduct.brandName = selectedBrand?.name || "";
      updatedProduct.categoryName = selectedCategory?.name || "";

      // Gọi API để lấy lại ảnh mới nhất sau khi update
      try {
        const imageRes = await axios.get(`http://localhost:8080/tirashop/product/${productData.id}/images`);
        const images = imageRes.data.data || [];
        const validImage = images.find(img => img.url);
        updatedProduct.image = validImage ? `http://localhost:8080${encodeURI(validImage.url)}` : null;
      } catch (imageError) {
        console.error("Error fetching updated image:", imageError);
        updatedProduct.image = null;
      }


      showToast("Sản phẩm đã được cập nhật thành công!", "success");
      onProductUpdated(updatedProduct); // ✅ Truyền lại object đầy đủ
      onClose();
    } catch (err) {
      console.error("Error updating product or uploading image:", err.response?.data || err);
      showToast("Failed to update product or upload image.", "error");
    }

    setLoading(false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa sản phẩm</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Tên sản phẩm</label>
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
              required
            />
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Mô tả</label>
            <textarea
              name="description"
              value={productData.description}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
            />
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Giá</label>
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
              required
            />
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Giá gốc</label>
            <input
              type="number"
              name="originalPrice"
              value={productData.originalPrice}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
              required
            />
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Kho</label>
            <input
              type="number"
              name="inventory"
              value={productData.inventory}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
              required
            />
          </div>
          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Kích thước</label>
            <select name="size" value={productData.size} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg">
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Trạng thái</label>
            <select
              name="status"
              value={productData.status}
              onChange={(e) => setProductData({ ...productData, status: e.target.value })}
              className="w-full px-3 py-1 border rounded-lg"
            >
              <option value="Available">Sẵn có</option>
              <option value="Disavailable">Hết hàng</option>
            </select>
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Danh mục</label>
            <select
              name="categoryId"
              value={productData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-1">
            <label className="block text-gray-700 text-sm font-medium">Thương hiệu</label>
            <select
              name="brandId"
              value={productData.brandId}
              onChange={handleChange}
              className="w-full px-3 py-1 border rounded-lg"
              required
            >
              <option value="">Chọn thương hiệu</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-gray-500 text-white rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1 bg-blue-500 text-white rounded-lg"
            >
              {loading ? "Updating..." : "Cập nhật sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
