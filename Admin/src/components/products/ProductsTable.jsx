
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Search, Plus, FileSpreadsheet, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import Pagination from '../common/Pagination';
import ToastProvider, { showToast } from "../ToastProvider";
import 'react-toastify/dist/ReactToastify.css';
import { IoEyeSharp } from "react-icons/io5";
import ReviewModal from './ReviewModal';
import { RiImageAddFill, RiImageEditFill } from "react-icons/ri";
import AddImagesModal from './AddImagesModal';
import EditImagesModal from './EditImagesModal';


const BASE_URL = 'http://localhost:8080';

// ─── Import Result Log Modal ────────────────────────────────────────────────
const ImportResultModal = ({ result, onClose }) => {
    if (!result) return null;
    const { successCount, failCount, errors } = result;
    const total = successCount + failCount;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className='bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden'
            >
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between ${failCount === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className='flex items-center gap-3'>
                        {failCount === 0
                            ? <CheckCircle className='text-green-500' size={22} />
                            : <AlertCircle className='text-yellow-500' size={22} />
                        }
                        <h2 className='text-base font-semibold text-gray-800'>
                            Kết quả Import Excel
                        </h2>
                    </div>
                    <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
                        <X size={20} />
                    </button>
                </div>

                {/* Summary */}
                <div className='px-6 py-4 flex gap-4 border-b border-gray-100'>
                    <div className='flex-1 bg-green-50 rounded-lg p-3 text-center'>
                        <p className='text-2xl font-bold text-green-600'>{successCount}</p>
                        <p className='text-xs text-green-700 mt-0.5'>Thành công</p>
                    </div>
                    <div className='flex-1 bg-red-50 rounded-lg p-3 text-center'>
                        <p className='text-2xl font-bold text-red-500'>{failCount}</p>
                        <p className='text-xs text-red-600 mt-0.5'>Thất bại</p>
                    </div>
                    <div className='flex-1 bg-blue-50 rounded-lg p-3 text-center'>
                        <p className='text-2xl font-bold text-blue-500'>{total}</p>
                        <p className='text-xs text-blue-600 mt-0.5'>Tổng cộng</p>
                    </div>
                </div>


                {errors && errors.length > 0 && (
                    <div className='px-6 py-4'>
                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                            Chi tiết lỗi ({errors.length})
                        </p>
                        <div className='bg-gray-50 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto'>
                            {errors.map((err, idx) => (
                                <div key={idx} className='px-3 py-2 flex items-start gap-2'>
                                    <span className='text-xs font-mono text-gray-400 mt-0.5 w-5 shrink-0'>
                                        {idx + 1}.
                                    </span>
                                    <p className='text-xs text-red-600 leading-relaxed'>
                                        {`Dòng ${err.row}${err.name ? ` - ${err.name}` : ''}${err.code ? ` [${err.code}]` : ''}: ${err.errorMessage}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className='px-6 pb-5 pt-2 flex justify-end'>
                    <button
                        onClick={onClose}
                        className='px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors'
                    >
                        Đóng
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const ProductsTable = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [expandedDescription, setExpandedDescription] = useState(null);

    // Image modals
    const [isAddImagesModalOpen, setIsAddImagesModalOpen] = useState(false);
    const [selectedProductForImage, setSelectedProductForImage] = useState(null);
    const [isEditImagesModalOpen, setIsEditImagesModalOpen] = useState(false);
    const [selectedProductForEditImages, setSelectedProductForEditImages] = useState(null);

    // Review modal
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedProductForReview, setSelectedProductForReview] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 5;

    // ── Import Excel states ──────────────────────────────────────────────────
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    // ── Fetch products ───────────────────────────────────────────────────────
    useEffect(() => {
        fetchProducts();
    }, [currentPage, searchTerm]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/tirashop/product`, {
                params: { limit: 1000 }
            });

            let fetchedProducts = response.data.data.elementList || [];

            if (searchTerm) {
                fetchedProducts = fetchedProducts.filter(product =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            const productsWithImages = await Promise.all(
                fetchedProducts.map(async (product) => {
                    try {
                        const imageRes = await axios.get(`${BASE_URL}/tirashop/product/${product.id}/images`);
                        const images = imageRes.data.data || [];
                        const validImage = images.find(img => img.url);
                        return {
                            ...product,
                            image: validImage ? `${BASE_URL}${encodeURI(validImage.url)}` : null,
                        };
                    } catch {
                        return { ...product, image: null };
                    }
                })
            );

            setTotalPages(Math.ceil(productsWithImages.length / pageSize));
            const paginated = productsWithImages.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
            setProducts(paginated);
        } catch (err) {
            console.error('Error fetching products:', err);
            showToast("Không thể tải danh sách sản phẩm.", "error");
        }
    };

    // ── Import Excel handler ─────────────────────────────────────────────────
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!fileInputRef.current) return;
        fileInputRef.current.value = ''; // reset để chọn lại cùng file nếu cần

        if (!file) return;

        const name = file.name.toLowerCase();
        if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
            showToast("Chỉ hỗ trợ file .xlsx hoặc .xls", "error");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        try {
            const res = await axios.post(`${BASE_URL}/tirashop/product/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const result = res.data; // ImportResultDTO
            console.log('[Import Result]', result);
            setImportResult(result);

            if (result.failCount === 0) {
                showToast(`Import thành công ${result.successCount} sản phẩm!`, "success");
            } else {
                showToast(`Import xong: ${result.successCount} thành công, ${result.failCount} lỗi.`, "warning");
            }

            // Reload lại danh sách
            fetchProducts();
        } catch (err) {
            console.error('[Import Error]', err);
            const msg = err.response?.data?.message || 'Import thất bại, vui lòng thử lại.';
            showToast(msg, "error");
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tirashop/product/import/template`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'product_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            showToast("Không thể tải template.", "error");
        }
    };

    // ── Other handlers ────────────────────────────────────────────────────────
    const handleProductAdded = (newProduct) => {
        setProducts((prev) => [...prev, newProduct]);
        setTimeout(() => {
            setCurrentPage(Math.ceil((products.length + 1) / pageSize) - 1);
        }, 100);
        setIsAddModalOpen(false);
    };

    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleProductUpdated = (updatedProduct) => {
        setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
        setIsEditModalOpen(false);
        setSelectedProduct(null);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(0);
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await axios.delete(`${BASE_URL}/tirashop/product/delete/${productToDelete.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
            showToast("Sản phẩm đã được xóa thành công!", "success");
        } catch (err) {
            console.error("Error deleting product:", err);
            showToast("Xóa sản phẩm thất bại.", "error");
        }
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className='my-8 p-6 bg-white text-black rounded-xl'>
            <ToastProvider />

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls'
                className='hidden'
                onChange={handleFileChange}
            />

            {/* Header */}
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>Danh Sách Sản Phẩm</h2>
                <div className='flex items-center gap-3 flex-wrap'>
                    {/* Search */}
                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Tìm kiếm tên sản phẩm...'
                            className='bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            onChange={handleSearchChange}
                            value={searchTerm}
                        />
                        <Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
                    </div>

                    {/* Download template */}
                    <button
                        onClick={handleDownloadTemplate}
                        title='Tải file mẫu Excel'
                        className='border border-green-500 text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors'
                    >
                        <Download size={16} />
                        <span className='hidden sm:inline'>Tải mẫu</span>
                    </button>

                    {/* Import Excel button */}
                    <button
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className='bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors'
                    >
                        {isImporting
                            ? <Loader2 size={16} className='animate-spin' />
                            : <FileSpreadsheet size={16} />
                        }
                        {isImporting ? 'Đang xử lý...' : 'Import Excel'}
                    </button>

                    {/* Add product */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors'
                    >
                        <Plus size={16} /> Thêm Sản Phẩm Mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300 table-fixed'>
                    <thead>
                        <tr>
                            <th className='pl-16 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>ID</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hình ảnh</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Tên</th>
                            <th className='px-0 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Mô tả</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Giá</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Giá gốc</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hàng tồn kho</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Kích thước</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Trạng thái</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Thương hiệu</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Danh mục</th>
                            <th className='py-3 pl-8 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hành động</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-300'>
                        {products.map((product) => (
                            <motion.tr
                                key={product.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <td className='pl-16 py-9 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]'>{product.id}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>
                                    {product.image
                                        ? <img src={product.image} alt={product.name} className="w-12 h-auto object-cover rounded-lg" />
                                        : "No Image"
                                    }
                                </td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.name}</td>
                                <td className='pr-8 py-4 text-sm text-gray-700 min-w-[400px]'>
                                    {expandedDescription === product.id
                                        ? <span>{product.description}</span>
                                        : <span>{product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}</span>
                                    }
                                    {product.description.length > 100 && (
                                        <button
                                            className='text-blue-500 ml-2'
                                            onClick={() => setExpandedDescription(expandedDescription === product.id ? null : product.id)}
                                        >
                                            {expandedDescription === product.id ? 'Hiển thị ít hơn' : 'Xem thêm'}
                                        </button>
                                    )}
                                </td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.price.toLocaleString()} VND</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.originalPrice.toLocaleString()} VND</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.inventory}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.size}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.status}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.brandName}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{product.categoryName}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>
                                    <button className='text-indigo-600 hover:text-indigo-500 mr-2' onClick={() => handleEditClick(product)}><Edit size={18} /></button>
                                    <button className='text-blue-400 hover:text-blue-600 mr-2' onClick={() => { setSelectedProductForReview(product); setIsReviewModalOpen(true); }}><IoEyeSharp size={18} /></button>
                                    <button className='text-green-500 hover:text-green-600 mr-2' onClick={() => { setSelectedProductForImage(product); setIsAddImagesModalOpen(true); }}><RiImageAddFill size={18} /></button>
                                    <button className='text-indigo-600 hover:text-indigo-500 mr-2' onClick={() => { setSelectedProductForEditImages(product); setIsEditImagesModalOpen(true); }}><RiImageEditFill size={18} /></button>
                                    <button className='text-red-600 hover:text-red-500' onClick={() => handleDeleteClick(product)}><Trash2 size={18} /></button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {/* Modals */}
            <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProductAdded={handleProductAdded} />
            {isEditModalOpen && <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={selectedProduct} onProductUpdated={handleProductUpdated} />}
            {isReviewModalOpen && <ReviewModal isOpen={isReviewModalOpen} onClose={() => { setIsReviewModalOpen(false); setSelectedProductForReview(null); }} product={selectedProductForReview} />}
            {isAddImagesModalOpen && <AddImagesModal isOpen={isAddImagesModalOpen} onClose={() => setIsAddImagesModalOpen(false)} productId={selectedProductForImage?.id} />}
            {isEditImagesModalOpen && selectedProductForEditImages && <EditImagesModal isOpen={isEditImagesModalOpen} onClose={() => setIsEditImagesModalOpen(false)} productId={selectedProductForEditImages.id} />}

            {/* Import Result Modal */}
            <AnimatePresence>
                {importResult && (
                    <ImportResultModal
                        result={importResult}
                        onClose={() => setImportResult(null)}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
                        <h2 className='text-lg font-semibold text-red-500'>Xác nhận xóa</h2>
                        <p className='text-gray-700 mt-2'>
                            Bạn có chắc chắn muốn xóa <span className='font-bold text-red-500'>{productToDelete?.name}</span>?
                        </p>
                        <div className='flex justify-center gap-4 mt-4'>
                            <button className='px-4 py-2 bg-gray-500 text-white rounded-lg' onClick={() => setIsDeleteModalOpen(false)}>Hủy</button>
                            <button className='px-4 py-2 bg-red-500 text-white rounded-lg' onClick={handleDeleteProduct}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsTable;