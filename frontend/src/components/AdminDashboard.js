// AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  Eye,
  Package,
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle,
  Users,
  Moon,
  Sun,
} from "lucide-react";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [products, setProducts] = useState([]);
  const [productsPagination, setProductsPagination] = useState({});
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesPagination, setEnquiriesPagination] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [showProductModal, setShowProductModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingEnquiry, setEditingEnquiry] = useState(null);

  // ---------- Utils ----------
  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed (${res.status})`);
    }
    // Some DELETE endpoints return no content
    if (res.status === 204) return null;
    return res.json();
  };

  const money = (n) =>
    typeof n === "number"
      ? n.toLocaleString("en-IN", { style: "currency", currency: "INR" })
      : n;

  // ---------- Initial Load ----------
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [pData, eData] = await Promise.all([
          fetchJSON(`${BASE_URL}/api/products`),
          fetchJSON(`${BASE_URL}/api/enquiries`),
        ]);
        setProducts(pData?.products || []);
        setProductsPagination(pData?.pagination || {});
        setEnquiries(eData?.enquiries || []);
        setEnquiriesPagination(eData?.pagination || {});
      } catch (e) {
        setErr(e.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------- Filters ----------
  const filteredProducts = (Array.isArray(products) ? products : []).filter(
    (p) => {
      const term = searchTerm.toLowerCase();
      return (
        p?.name?.toLowerCase()?.includes(term) ||
        p?.category?.toLowerCase()?.includes(term)
      );
    }
  );

  const filteredEnquiries = (Array.isArray(enquiries) ? enquiries : []).filter(
    (enq) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        enq?.name?.toLowerCase()?.includes(term) ||
        enq?.email?.toLowerCase()?.includes(term) ||
        enq?.subject?.toLowerCase()?.includes(term);
      const matchesStatus = filterStatus === "all" || enq?.status === filterStatus;
      const matchesPriority =
        filterPriority === "all" || enq?.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    }
  );

  // ---------- Color helpers ----------
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // ---------- Product CRUD ----------
  const createProduct = async (data) => {
    const created = await fetchJSON(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setProducts((prev) => [created, ...prev]);
  };

  const handleUpdateProduct = async (id, updatedData) => {
    const updated = await fetchJSON(`${BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
  };

  const handleDeleteProduct = async (id) => {
    const ok = window.confirm("Delete this product permanently?");
    if (!ok) return;
    await fetchJSON(`${BASE_URL}/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  // ---------- Enquiry actions ----------
  const handleUpdateEnquiry = async (id, updatedData) => {
    const updated = await fetchJSON(`${BASE_URL}/api/enquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    setEnquiries((prev) => prev.map((e) => (e._id === id ? updated : e)));
  };

  const handleDeleteEnquiry = async (id) => {
    const ok = window.confirm("Delete this enquiry permanently?");
    if (!ok) return;
    await fetchJSON(`${BASE_URL}/api/enquiries/${id}`, { method: "DELETE" });
    setEnquiries((prev) => prev.filter((e) => e._id !== id));
  };

  const handleMarkDone = (id) =>
    handleUpdateEnquiry(id, { status: "completed" });

  const handleMarkCritical = (id) =>
    handleUpdateEnquiry(id, { priority: "urgent" });

  // ---------- Product Modal ----------
  const ProductModal = () => {
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      price: "",
      category: "",
      image: "",
      stock: "",
      featured: false,
    });
    const [saving, setSaving] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
      if (editingProduct) {
        // hydrate form with existing product
        const { ratings, ...rest } = editingProduct; // avoid mutating nested objects inadvertently
        setFormData({
          ratings, // ignored on submit unless backend uses it
          ...rest,
        });
      }
    }, [editingProduct]);

    const onSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      setErrMsg("");
      try {
        const payload = {
          name: formData.name?.trim(),
          description: formData.description?.trim(),
          price:
            typeof formData.price === "number"
              ? formData.price
              : parseFloat(formData.price),
          category: formData.category?.trim(),
          image: formData.image?.trim(),
          stock:
            typeof formData.stock === "number"
              ? formData.stock
              : parseInt(formData.stock, 10),
          featured: !!formData.featured,
          isActive:
            typeof formData.isActive === "boolean" ? formData.isActive : true,
        };

        if (editingProduct?._id) {
          await handleUpdateProduct(editingProduct._id, payload);
        } else {
          await createProduct(payload);
        }

        setShowProductModal(false);
        setEditingProduct(null);
      } catch (e) {
        setErrMsg(e.message || "Failed to save product");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          {errMsg && (
            <div className="mb-3 rounded-lg bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {errMsg}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-24 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
                required
              />
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
                required
              />
              <input
                type="url"
                placeholder="Image URL"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
              />
            </div>
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={!!formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="rounded"
              />
              <span>Featured Product</span>
            </label>

            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                  ? "Update Product"
                  : "Create Product"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------- Enquiry Modal ----------
  const EnquiryModal = () => {
    const [formData, setFormData] = useState({
      status: "pending",
      priority: "medium",
    });
    const [saving, setSaving] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
      if (editingEnquiry) {
        setFormData({
          status: editingEnquiry.status || "pending",
          priority: editingEnquiry.priority || "medium",
        });
      }
    }, [editingEnquiry]);

    const onSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      setErrMsg("");
      try {
        await handleUpdateEnquiry(editingEnquiry._id, formData);
        setShowEnquiryModal(false);
        setEditingEnquiry(null);
      } catch (e) {
        setErrMsg(e.message || "Failed to update enquiry");
      } finally {
        setSaving(false);
      }
    };

    if (!editingEnquiry) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Enquiry Details
          </h3>
          {errMsg && (
            <div className="mb-3 rounded-lg bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {errMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Info label="Name" value={editingEnquiry.name} />
            <Info label="Email" value={editingEnquiry.email} />
            <Info label="Phone" value={editingEnquiry.phone} />
            <Info label="City" value={editingEnquiry.city} />
          </div>
          <Info
            label="Message"
            value={editingEnquiry.message}
            multiline
            className="mt-2"
          />

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update Enquiry"}
              </button>
              <button
                type="button"
                onClick={() => window.open(`tel:${editingEnquiry.phone}`)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
              >
                <Phone size={16} />
                Call
              </button>
              <button
                type="button"
                onClick={() => window.open(`mailto:${editingEnquiry.email}`)}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700"
              >
                <Mail size={16} />
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEnquiryModal(false);
                  setEditingEnquiry(null);
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300 dark:bg-neutral-800 dark:text-gray-100 dark:hover:bg-neutral-700"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------- UI ----------
  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
        {/* Header */}
        <div className="border-b bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                Admin Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <Stat
                  icon={<Package className="text-blue-600" size={18} />}
                  label="Products"
                  value={products.length}
                  color="blue"
                />
                <Stat
                  icon={<Users className="text-green-600" size={18} />}
                  label="Enquiries"
                  value={enquiries.length}
                  color="green"
                />
                <button
                  onClick={() => setDark((d) => !d)}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                  title="Toggle theme"
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                  <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-6 flex gap-2">
            <TabButton
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              icon={<Package size={16} />}
              label="Products Management"
            />
            <TabButton
              active={activeTab === "enquiries"}
              onClick={() => setActiveTab("enquiries")}
              icon={<MessageSquare size={16} />}
              label="Enquiries Management"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {loading && (
            <div className="rounded-lg bg-white p-4 text-gray-700 shadow dark:bg-neutral-900 dark:text-gray-200">
              Loading...
            </div>
          )}
          {err && !loading && (
            <div className="rounded-lg bg-red-100 p-3 text-red-700 shadow dark:bg-red-900/30 dark:text-red-300">
              {err}
            </div>
          )}

          {/* Products */}
          {!loading && activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                  Products
                </h2>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="overflow-hidden rounded-xl bg-white shadow-md dark:bg-neutral-900"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-44 w-full object-cover sm:h-48"
                    />
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {product.name}
                        </h3>
                        {product.featured && (
                          <Star className="shrink-0 text-yellow-500" size={16} />
                        )}
                      </div>
                      <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                        {product.description}
                      </p>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-600">
                          {money(product.price)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {product.category}
                        </span>
                      </div>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Stock: {product.stock}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <Star className="text-yellow-400" size={12} />
                          <span>
                            {(product?.ratings?.average ?? 0).toFixed(1)} (
                            {product?.ratings?.count ?? 0})
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductModal(true);
                          }}
                          className="flex-1 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Edit size={14} /> Edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="flex-1 items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Trash2 size={14} /> Delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-gray-400">
                    No products found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enquiries */}
{/* Enquiries */}
{!loading && activeTab === "enquiries" && (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
      Enquiries Management
    </h2>

    {/* Filters */}
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search enquiries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>

    {/* Mobile view → Cards */}
    <div className="md:hidden space-y-4">
      {filteredEnquiries.map((enquiry) => (
        <div
          key={enquiry._id}
          className="relative overflow-hidden rounded-xl bg-white shadow dark:bg-neutral-900"
        >
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{enquiry.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(enquiry.status)}`}>
                {enquiry.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enquiry.email} | {enquiry.phone}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {enquiry.city}, {enquiry.state}
            </p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(enquiry.priority)}`}>
              {enquiry.priority}
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setEditingEnquiry(enquiry) || setShowEnquiryModal(true)}
                className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-white text-xs"
              >
                <Edit size={14}/> Edit
              </button>
              <a href={`tel:${enquiry.phone}`} className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-white text-xs">
                <Phone size={14}/> Call
              </a>
              <a href={`mailto:${enquiry.email}`} className="flex items-center gap-1 rounded bg-purple-600 px-3 py-1 text-white text-xs">
                <Mail size={14}/> Mail
              </a>
              <button
                onClick={() => handleDeleteEnquiry(enquiry._id)}
                className="flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-white text-xs"
              >
                <Trash2 size={14}/> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop view → Table */}
    <div className="hidden md:block overflow-hidden rounded-xl bg-white shadow dark:bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <Th>Customer</Th>
              <Th>Contact</Th>
              <Th>Location</Th>
              <Th>Status</Th>
              <Th>Priority</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {filteredEnquiries.map((enquiry) => (
              <tr key={enquiry._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60">
                <Td>{enquiry.name}</Td>
                <Td>{enquiry.email} <br /> {enquiry.phone}</Td>
                <Td>{enquiry.city}, {enquiry.state}</Td>
                <Td>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(enquiry.status)}`}>
                    {enquiry.status}
                  </span>
                </Td>
                <Td>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(enquiry.priority)}`}>
                    {enquiry.priority}
                  </span>
                </Td>
                <Td>{new Date(enquiry.createdAt).toLocaleDateString()}</Td>
                <Td className="flex gap-3">
                  <button onClick={() => setEditingEnquiry(enquiry) || setShowEnquiryModal(true)} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                    <Edit size={14}/> Edit
                  </button>
                  <a href={`tel:${enquiry.phone}`} className="text-green-600 hover:underline text-sm flex items-center gap-1">
                    <Phone size={14}/> Call
                  </a>
                  <a href={`mailto:${enquiry.email}`} className="text-purple-600 hover:underline text-sm flex items-center gap-1">
                    <Mail size={14}/> Mail
                  </a>
                  <button onClick={() => handleDeleteEnquiry(enquiry._id)} className="text-red-600 hover:underline text-sm flex items-center gap-1">
                    <Trash2 size={14}/> Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

        </div>

        {/* Modals */}
        {showProductModal && <ProductModal />}
        {showEnquiryModal && <EnquiryModal />}
      </div>
    </div>
  );
};

// ---------- Small UI helpers ----------
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
      active
        ? "bg-blue-600 text-white"
        : "bg-white text-gray-700 hover:text-gray-900 dark:bg-neutral-900 dark:text-gray-200 dark:hover:text-white"
    }`}
  >
    {icon}
    <span className="text-sm sm:text-base">{label}</span>
  </button>
);

const Stat = ({ icon, label, value }) => (
  <div className="rounded-lg bg-blue-50 p-3 dark:bg-neutral-800">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {label}: {value}
      </span>
    </div>
  </div>
);

const Th = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
    {children}
  </th>
);

const Td = ({ children }) => (
  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
    {children}
  </td>
);

const IconBtn = ({ children, onClick, title, color }) => {
  const colorMap = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    red: "bg-red-600 hover:bg-red-700",
    gray: "bg-gray-600 hover:bg-gray-700",
    black: "bg-neutral-900 hover:bg-black",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-white ${colorMap[color] || "bg-gray-600 hover:bg-gray-700"}`}
    >
      {children}
    </button>
  );
};

const Info = ({ label, value, multiline, className = "" }) => (
  <div className={className}>
    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    {multiline ? (
      <div className="h-24 overflow-y-auto rounded-lg bg-gray-100 p-2 text-sm text-gray-800 dark:bg-neutral-800 dark:text-gray-100">
        {value || "-"}
      </div>
    ) : (
      <div className="rounded-lg bg-gray-100 p-2 text-sm text-gray-800 dark:bg-neutral-800 dark:text-gray-100">
        {value || "-"}
      </div>
    )}
  </div>
);

export default AdminDashboard;
