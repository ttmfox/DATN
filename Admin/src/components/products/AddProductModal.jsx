import React, { useState, useEffect } from "react";
import axios from "axios";
import { showToast } from "../ToastProvider";
import { X } from "lucide-react";

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const [productData, setProductData] = useState({
    name: "",
    code: "",
    description: "",
    material: "",
    price: "",
    originalPrice: "",
    quantity: "",
    size: "XL",
    status: "Available",
    tagName: "",
    categoryId: "",
    brandId: "",
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setProductData({
        name: "",
        code: "",
        description: "",
        material: "",
        price: "",
        originalPrice: "",
        quantity: "",
        size: "XL",
        status: "Available",
        tagName: "",
        categoryId: "",
        brandId: "",
      });
    }
  }, [isOpen]);

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
      const payload = {
        name: productData.name,
        code: productData.code,
        description: productData.description,
        material: productData.material,
        price: parseFloat(productData.price),
        originalPrice: parseFloat(productData.originalPrice),
        quantity: parseInt(productData.quantity, 10),
        size: productData.size,
        status: productData.status,
        tagName: productData.tagName,
        categoryId: Number(productData.categoryId),
        brandId: Number(productData.brandId),
      };

      const productResponse = await axios.post(
        "http://localhost:8080/tirashop/product/add",
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const newProductId = productResponse.data.data.id;
      console.log("✅ Product Created:", newProductId);

      await new Promise((resolve) => setTimeout(resolve, 500));

      showToast("Thêm mới sản phẩm thành công!", "success");
      onProductAdded(productResponse.data.data);
      onClose();
    } catch (err) {
      showToast("Có lỗi xảy ra!", "error");
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[640px]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Thêm sản phẩm mới</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="grid grid-cols-2 gap-x-4">

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Tên sản phẩm</label>
              <input type="text" name="name" value={productData.name} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required />
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Mã sản phẩm (code)</label>
              <input type="text" name="code" value={productData.code} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required />
            </div>

            <div className="mb-1 col-span-2">
              <label className="block text-gray-700 text-sm font-medium">Mô tả</label>
              <textarea name="description" value={productData.description} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" />
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Giá bán</label>
              <input type="number" name="price" value={productData.price} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required />
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Giá hiển thị</label>
              <input type="number" name="originalPrice" value={productData.originalPrice} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required />
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Số lượng nhập</label>
              <input type="number" name="quantity" value={productData.quantity} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required min="0" />
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Chất liệu</label>
              <input type="text" name="material" value={productData.material} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" />
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Kích cỡ</label>
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
              <select name="categoryId" value={productData.categoryId} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required>
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Thương hiệu</label>
              <select name="brandId" value={productData.brandId} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" required>
                <option value="">Chọn thương hiệu</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-1">
              <label className="block text-gray-700 text-sm font-medium">Tag</label>
              <input type="text" name="tagName" value={productData.tagName} onChange={handleChange} className="w-full px-3 py-1 border rounded-lg" placeholder="VD: new, sale, hot" />
            </div>

          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-1 bg-gray-500 text-white rounded-lg">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-1 bg-blue-500 text-white rounded-lg">{loading ? "Adding..." : "Thêm mới"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;