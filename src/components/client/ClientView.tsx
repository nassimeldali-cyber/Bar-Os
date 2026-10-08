import React, { useState, useEffect, useMemo } from 'react';
import { dbEngine } from '../../lib/dbEngine';
import { useRealtime } from '../../context/RealtimeContext';
import {
  TableItem,
  Restaurant,
  TableSession,
  Category,
  Product,
  Order,
  CartItem
} from '../../types/database';
import {
  Utensils,
  ShoppingBag,
  Bell,
  Receipt,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  Trash2,
  Wine,
  Beer,
  Coffee,
  UtensilsCrossed,
  Flame,
  Cake,
  AlertCircle,
  HelpCircle,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ClientViewProps {
  restaurantId: string;
  tableId: string;
  onSwitchTable?: (newTableId: string) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({
  restaurantId,
  tableId,
  onSwitchTable
}) => {
  const { lastEventTimestamp } = useRealtime();

  // Core entities
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<TableItem | null>(null);
  const [session, setSession] = useState<TableSession | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]);

  // Navigation & interaction
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [billRequestedMessage, setBillRequestedMessage] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');

  // Table selector toggle (for easy demo testing in one browser)
  const [showTablePicker, setShowTablePicker] = useState(false);
  const allTables = useMemo(() => dbEngine.getTables(restaurantId), [restaurantId, lastEventTimestamp]);

  // Load and sync data
  const loadData = () => {
    const r = dbEngine.getRestaurant(restaurantId);
    const t = dbEngine.getTableById(tableId);
    setRestaurant(r || null);
    setTable(t || null);

    if (r && t) {
      // Get or create active session
      const sess = dbEngine.getOrCreateActiveSession(r.id, t.id);
      setSession(sess);

      // Load menu
      setCategories(dbEngine.getCategories(r.id));
      setProducts(dbEngine.getProducts(r.id));

      // Load session orders
      setSessionOrders(dbEngine.getOrdersBySession(sess.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurantId, tableId, lastEventTimestamp]);

  // Category Icon resolver
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Wine':
        return <Wine className="w-4 h-4" />;
      case 'Beer':
        return <Beer className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Cake':
        return <Cake className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  // Cart actions
  const addToCart = (product: Product) => {
    if (!product.available) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Place order
  const handlePlaceOrder = async () => {
    if (!restaurant || !table || !session || cart.length === 0 || isSubmittingOrder) return;
    setIsSubmittingOrder(true);

    try {
      const items = cart.map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
        notes: c.notes
      }));

      const newOrder = dbEngine.createOrder(
        restaurant.id,
        session.id,
        table.id,
        items,
        orderNotes
      );

      setCart([]);
      setOrderNotes('');
      setIsCartOpen(false);
      setOrderSuccessBanner(`Commande #${newOrder.order_number} confirmée et transmise à l'équipe !`);
      setTimeout(() => setOrderSuccessBanner(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la commande');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Service Request
  const handleCallServer = (type: 'CALL_SERVER' | 'WATER_REQUEST') => {
    if (!table || !restaurant) return;
    dbEngine.createServiceRequest(table.id, restaurant.id, type, session?.id);
    setServiceMessage(type === 'CALL_SERVER' ? 'Serveur prévenu, il arrive !' : "Demande d'eau enregistrée !");
    setTimeout(() => setServiceMessage(null), 4000);
  };

  // Request Bill
  const handleRequestBill = () => {
    if (!session) return;
    if (session.total_amount <= 0 && sessionOrders.length === 0) {
      alert("Vous n'avez pas encore passé de commande sur cette table.");
      return;
    }
    const confirm = window.confirm("Confirmer la demande de l'addition ? Le serveur viendra procéder à l'encaissement.");
    if (!confirm) return;

    dbEngine.requestBill(session.id);
    setBillRequestedMessage("Addition demandée ! Le serveur arrive à votre table.");
    loadData();
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => p.category_id === activeCategory);
  }, [products, activeCategory]);

  if (!restaurant || !table) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Table introuvable</h2>
        <p className="text-xs text-slate-500 mt-1">
          Le QR Code scanné ne correspond à aucun établissement actif.
        </p>
      </div>
    );
  }

  // If session is closed, display completion screen
  const isSessionClosed = session?.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900">
      {/* Top Banner / Table Header */}
      <div className="bg-slate-900 text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg border-b border-slate-800">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                {restaurant.name}
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <h1 className="text-2xl font-black tracking-tight">Table {table.table_number}</h1>
                <span className="text-xs text-slate-400 font-medium">({table.zone})</span>
              </div>
            </div>

            {/* Switch table dropdown for demo */}
            {onSwitchTable && (
              <div className="relative">
                <button
                  onClick={() => setShowTablePicker(!showTablePicker)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1 transition"
                >
                  Changer de table
                </button>
                {showTablePicker && (
                  <div className="absolute right-0 top-10 w-44 bg-white text-slate-900 rounded-xl shadow-2xl p-2 z-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Choisir une table :</p>
                    {allTables.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setShowTablePicker(false);
                          onSwitchTable(t.id);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                          t.id === table.id ? 'bg-amber-100 font-bold text-amber-900' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>Table {t.table_number}</span>
                        <span className="text-[10px] text-slate-400">{t.zone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session Info Bar */}
          <div className="bg-slate-800/80 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-mono">
                  {session?.session_code || 'Session'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  session?.status === 'OPEN'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : session?.status === 'ADDITION_REQUESTED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-600 text-slate-300'
                }`}>
                  {session?.status === 'OPEN'
                    ? 'Session Ouverte'
                    : session?.status === 'ADDITION_REQUESTED'
                    ? 'Addition demandée'
                    : session?.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {sessionOrders.length} commande{sessionOrders.length > 1 ? 's' : ''} passée{sessionOrders.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Table</span>
              <p className="text-lg font-black text-amber-400 leading-tight">
                {(session?.total_amount || 0).toFixed(3)} {restaurant.currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="max-w-md mx-auto px-4 mt-3 space-y-2">
        {orderSuccessBanner && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{orderSuccessBanner}</span>
          </div>
        )}

        {serviceMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
            <Bell className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{serviceMessage}</span>
          </div>
        )}

        {session?.status === 'ADDITION_REQUESTED' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
            <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Addition demandée</p>
              <p className="text-[11px] font-normal text-amber-700">Le serveur arrive pour le règlement physique (Espèces ou TPE).</p>
            </div>
          </div>
        )}

        {isSessionClosed && (
          <div className="bg-slate-900 text-white p-5 rounded-3xl text-center shadow-lg my-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-bold text-base">Paiement effectué & Session Clôturée</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Merci de votre visite au {restaurant.name} ! La session de la Table {table.table_number} est désormais fermée.
            </p>
            <button
              onClick={() => {
                dbEngine.getOrCreateActiveSession(restaurant.id, table.id);
                loadData();
              }}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition"
            >
              Ouvrir une nouvelle session
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Pills (Service, Water, History) */}
      <div className="max-w-md mx-auto px-4 mt-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCallServer('CALL_SERVER')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            Serveur
          </button>
          <button
            onClick={() => handleCallServer('WATER_REQUEST')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            Eau / Verre
          </button>
          <button
            onClick={() => setIsOrdersOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition relative"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Historique
            {sessionOrders.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {sessionOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills Horizontal Scroll */}
      <div className="max-w-md mx-auto px-4 mt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tout ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {getCategoryIcon(cat.icon)}
                {cat.name}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-md mx-auto px-4 mt-2 space-y-3">
        {filteredProducts.map((prod) => {
          const inCartItem = cart.find((c) => c.product.id === prod.id);

          return (
            <div
              key={prod.id}
              className={`bg-white rounded-2xl p-3 border transition flex gap-3 shadow-2xs ${
                prod.available
                  ? 'border-slate-200 hover:border-amber-300'
                  : 'border-slate-200/60 opacity-60 bg-slate-50'
              }`}
            >
              {/* Product Image */}
              <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative">
                {prod.image_url ? (
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Utensils className="w-6 h-6" />
                  </div>
                )}
                {!prod.available && (
                  <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center p-1">
                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Épuisé
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {prod.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {prod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                  <span className="font-extrabold text-sm text-slate-900">
                    {prod.price.toFixed(3)} <span className="text-[10px] font-semibold text-slate-500">{restaurant.currency}</span>
                  </span>

                  {prod.available ? (
                    inCartItem ? (
                      <div className="flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-2 py-1">
                        <button
                          onClick={() => updateCartQty(prod.id, -1)}
                          className="p-1 hover:text-amber-400 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">
                          {inCartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(prod.id, 1)}
                          className="p-1 hover:text-amber-400 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod)}
                        className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Ajouter
                      </button>
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Indisponible
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar: Cart & Bill */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-gradient-to-t from-white via-white/95 to-transparent">
        <div className="max-w-md mx-auto flex items-center gap-2">
          {/* Bill Request button */}
          <button
            onClick={handleRequestBill}
            disabled={session?.status === 'ADDITION_REQUESTED'}
            className={`flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition shadow-md ${
              session?.status === 'ADDITION_REQUESTED'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Demander</span> Addition
          </button>

          {/* Cart Trigger button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`flex-1 flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-extrabold transition shadow-lg ${
              cartCount > 0
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-500 hover:to-amber-600'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Panier ({cartCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{cartTotal.toFixed(3)} {restaurant.currency}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Cart Modal / Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border-t border-slate-100">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">Votre commande — Table {table.table_number}</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Votre panier est actuellement vide.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-xs text-slate-900">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.product.price.toFixed(3)} × {item.quantity} ={' '}
                        <span className="font-semibold text-slate-800">
                          {(item.product.price * item.quantity).toFixed(3)} {restaurant.currency}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="p-1 text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Order Notes */}
              {cart.length > 0 && (
                <div className="pt-3">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Instructions particulières pour le bar/cuisine :
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: glaçons supplémentaires, sauce à part..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3 text-sm font-bold">
                  <span>Total commande à valider :</span>
                  <span className="text-base text-slate-950 font-black">
                    {cartTotal.toFixed(3)} {restaurant.currency}
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmittingOrder}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-amber-300 font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  {isSubmittingOrder ? 'Transmission en cours...' : `Confirmer la commande (${cartTotal.toFixed(3)} ${restaurant.currency})`}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  La commande sera immédiatement transmise au serveur de votre zone.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders History Drawer */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border-t border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-base">Historique de la Session</h3>
                <p className="text-[11px] text-slate-400">
                  {session?.session_code} • Table {table.table_number}
                </p>
              </div>
              <button
                onClick={() => setIsOrdersOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {sessionOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Aucune commande passée dans cette session.
                </div>
              ) : (
                sessionOrders.map((ord) => {
                  const statusColors: Record<string, string> = {
                    NEW: 'bg-blue-100 text-blue-800',
                    ACCEPTED: 'bg-indigo-100 text-indigo-800',
                    TRANSMITTED_TO_POS: 'bg-purple-100 text-purple-800',
                    PREPARING: 'bg-amber-100 text-amber-800',
                    READY: 'bg-emerald-100 text-emerald-800',
                    SERVED: 'bg-slate-100 text-slate-800',
                    CANCELLED: 'bg-red-100 text-red-800'
                  };

                  const statusLabels: Record<string, string> = {
                    NEW: 'En attente serveur',
                    ACCEPTED: 'Acceptée',
                    TRANSMITTED_TO_POS: 'Transmise à la caisse',
                    PREPARING: 'En préparation',
                    READY: 'Prête',
                    SERVED: 'Servie',
                    CANCELLED: 'Annulée'
                  };

                  return (
                    <div key={ord.id} className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">
                            Commande #{ord.order_number}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[ord.status] || 'bg-slate-100'}`}>
                          {statusLabels[ord.status] || ord.status}
                        </span>
                      </div>

                      <div className="space-y-1 mb-2">
                        {ord.items?.map((it) => (
                          <div key={it.id} className="flex justify-between text-xs text-slate-700">
                            <span>
                              {it.quantity}× {it.product_name}
                            </span>
                            <span className="font-medium text-slate-900">
                              {it.total_price.toFixed(3)} {restaurant.currency}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-200/80 pt-2 flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Sous-total :</span>
                        <span className="text-slate-900">{ord.total.toFixed(3)} {restaurant.currency}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total Footer */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Cumulé Session</span>
                <p className="text-lg font-black text-amber-400">
                  {(session?.total_amount || 0).toFixed(3)} {restaurant.currency}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsOrdersOpen(false);
                  handleRequestBill();
                }}
                disabled={session?.status === 'ADDITION_REQUESTED'}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                {session?.status === 'ADDITION_REQUESTED' ? 'Addition demandée' : "Demander l'addition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
