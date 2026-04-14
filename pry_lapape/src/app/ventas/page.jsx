"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Receipt, RefreshCcw, Search, ShoppingCart, Trash2 } from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { CommercialEmptyState, CommercialModalShell } from "@/components/commercial/CommercialUI";
import Input from "@/components/Inputs";
import { getBranches } from "@/lib/branches.service";
import { createPosSale, getPosProducts, reprintPosTicket } from "@/lib/pos.service";

const PAYMENT_METHOD_OPTIONS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "MIXTO", label: "Mixto" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function TicketModal({ sale, reprinting, onClose, onReprint }) {
  if (!sale) return null;

  return (
    <CommercialModalShell
      eyebrow="Ventas"
      title={`Ticket ${sale.folio}`}
      subtitle="Venta confirmada correctamente."
      maxWidthClassName="max-w-3xl"
      onClose={onClose}
    >
      <div className="space-y-4 px-6 py-5 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Sucursal</p>
            <p className="mt-2 font-semibold text-[#1F2933]">{sale.branch?.name || "Sin sucursal"}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Fecha</p>
            <p className="mt-2 font-semibold text-[#1F2933]">{formatDateTime(sale.createdAt)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#FFF9E6]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Cant.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Importe</th>
              </tr>
            </thead>
            <tbody>
              {sale.saleDetails.map((item) => (
                <tr key={item.id} className="border-t border-[#F1F5F9]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1F2933]">{item.productName}</p>
                    {item.offer ? (
                      <p className="text-xs text-[#8A5C00]">{item.offer.name}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{item.quantity}</td>
                  <td className="px-4 py-3 font-semibold text-[#1F2933]">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-[#FFE9A8] bg-[#FFF8DB] p-4">
          <div className="flex items-center justify-between text-sm text-[#4B5563]">
            <span>Metodo</span>
            <span className="font-semibold text-[#1F2933]">{sale.paymentMethod}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1F2933]">{formatCurrency(sale.subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
            <span>Descuento</span>
            <span className="font-semibold text-[#1F2933]">{formatCurrency(sale.discount)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#F6E7B8] pt-3">
            <span className="text-sm font-semibold text-[#1F2933]">Total</span>
            <span className="text-2xl font-extrabold text-[#1F2933]">{formatCurrency(sale.total)}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={onClose}>
            Cerrar
          </SecondaryButton>
          <PrimaryButton type="button" disabled={reprinting} onClick={() => onReprint(sale.id)}>
            <Receipt size={16} />
            {reprinting ? "Reimprimiendo..." : "Reimprimir ticket"}
          </PrimaryButton>
        </div>
      </div>
    </CommercialModalShell>
  );
}

function CheckoutModal({
  open,
  branchName,
  paymentMethod,
  notes,
  subtotal,
  discount,
  total,
  itemCount,
  processingSale,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <CommercialModalShell
      eyebrow="Cobro"
      title="Confirmar venta"
      subtitle="Revisa el resumen final antes de registrar la venta."
      maxWidthClassName="max-w-2xl"
      onClose={onClose}
    >
      <div className="space-y-4 px-6 py-5 sm:px-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Sucursal</p>
            <p className="mt-2 font-semibold text-[#1F2933]">{branchName || "Sin sucursal"}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Metodo de pago</p>
            <p className="mt-2 font-semibold text-[#1F2933]">{paymentMethod}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center justify-between text-sm text-[#4B5563]">
            <span>Articulos</span>
            <span className="font-semibold text-[#1F2933]">{itemCount}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#1F2933]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
            <span>Descuento</span>
            <span className="font-semibold text-[#1F2933]">{formatCurrency(discount)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
            <span className="text-sm font-semibold text-[#1F2933]">Total final</span>
            <span className="text-2xl font-extrabold text-[#1F2933]">{formatCurrency(total)}</span>
          </div>
        </div>

        {notes ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Observaciones</p>
            <p className="mt-2 text-sm text-[#4B5563]">{notes}</p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={onClose} disabled={processingSale}>
            Volver
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={processingSale}>
            <CreditCard size={16} />
            {processingSale ? "Procesando..." : "Hacer venta"}
          </PrimaryButton>
        </div>
      </div>
    </CommercialModalShell>
  );
}

export default function VentasPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchProducts, setBranchProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [manualDiscount, setManualDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [processingSale, setProcessingSale] = useState(false);
  const [reprinting, setReprinting] = useState(false);
  const [error, setError] = useState("");
  const [ticketSale, setTicketSale] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchItems = await getBranches();
        setBranches(branchItems);
        if (branchItems[0]) {
          setSelectedBranchId(branchItems[0].id);
        }
        setError("");
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la configuracion comercial.");
      }
    };

    loadBranches();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const items = await getPosProducts(selectedBranchId);
        setBranchProducts(items);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los productos del POS.");
      } finally {
        setLoadingProducts(false);
      }
    };

    setCart([]);
    setProductQuery("");
    loadProducts();
  }, [selectedBranchId]);

  const suggestions = useMemo(() => {
    const query = normalizeText(productQuery);
    if (!query) return [];

    return branchProducts
      .filter((product) => {
        return (
          normalizeText(product.name).includes(query) ||
          normalizeText(product.sku).includes(query) ||
          normalizeText(product.category).includes(query)
        );
      })
      .slice(0, 8);
  }, [branchProducts, productQuery]);

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.min(Math.max(0, Number(manualDiscount || 0)), subtotal);
    return {
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
    };
  }, [cart, manualDiscount]);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + 1, product.stock);
        return current.map((item) => (item.id === product.id ? { ...item, quantity: nextQuantity } : item));
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
    setProductQuery("");
    searchInputRef.current?.focus();
  };

  const updateCartQuantity = (productId, quantity) => {
    setCart((current) =>
      current.map((item) => {
        if (item.id !== productId) return item;
        const safeQuantity = Math.max(1, Math.min(item.stock, Number(quantity || 1)));
        return { ...item, quantity: safeQuantity };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  const resetSale = () => {
    setCart([]);
    setManualDiscount("0");
    setNotes("");
    setProductQuery("");
    setError("");
  };

  const handleCreateSale = async () => {
    setProcessingSale(true);
    try {
      const sale = await createPosSale({
        branchId: selectedBranchId,
        paymentMethod,
        manualDiscount: Number(manualDiscount || 0),
        notes,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      setTicketSale(sale);
      setCheckoutOpen(false);
      resetSale();
      const items = await getPosProducts(selectedBranchId);
      setBranchProducts(items);
      searchInputRef.current?.focus();
    } catch (saveError) {
      setError(saveError.message || "No se pudo confirmar la venta.");
    } finally {
      setProcessingSale(false);
    }
  };

  const handleReprint = async (saleId) => {
    setReprinting(true);
    try {
      const sale = await reprintPosTicket(saleId);
      setTicketSale(sale);
      setError("");
    } catch (printError) {
      setError(printError.message || "No se pudo reimprimir el ticket.");
    } finally {
      setReprinting(false);
    }
  };

  return (
    <RoleLayout
      requiredRoles={["DUENO", "ADMIN"]}
      title="Ventas"
      subtitle="POS administrativo"
      maxWidthClassName="max-w-[1500px]"
    >
      <section className="space-y-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#1F2933]">Ventas</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value)}
              className="h-10 min-w-[220px] rounded-xl border border-[#DCE7F8] bg-[#FCFCFD] px-3 text-sm text-[#1F2933] outline-none"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <SecondaryButton
              type="button"
              onClick={async () => {
                if (!selectedBranchId) return;
                setLoadingProducts(true);
                try {
                  const items = await getPosProducts(selectedBranchId);
                  setBranchProducts(items);
                  setError("");
                } catch (loadError) {
                  setError(loadError.message || "No se pudo recargar el POS.");
                } finally {
                  setLoadingProducts(false);
                }
              }}
            >
              <RefreshCcw size={16} />
              Recargar
            </SecondaryButton>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF1F2] px-4 py-3 text-sm text-[#BE123C]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.35fr,0.95fr]">
          <div className="space-y-3">
            <div className="relative rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-[#6B7280]" />
                <input
                  ref={searchInputRef}
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Buscar producto para vender..."
                  className="w-full bg-transparent text-sm text-[#1F2933] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>

              {productQuery ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                  {loadingProducts ? (
                    <div className="px-4 py-3 text-sm text-[#6B7280]">Buscando...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#6B7280]">Sin coincidencias en la sucursal seleccionada.</div>
                  ) : (
                    suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex w-full items-center justify-between gap-4 border-b border-[#F1F5F9] px-4 py-3 text-left last:border-b-0 hover:bg-[#FCFCFD]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1F2933]">{product.name}</p>
                          <p className="truncate text-xs text-[#6B7280]">
                            {product.sku || "Sin SKU"} · {product.category || "Sin categoria"} · Stock {product.stock}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-[#1D6FD1]">{formatCurrency(product.price)}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="border-b border-[#F1F5F9] px-4 py-3">
                <h3 className="text-sm font-semibold text-[#1F2933]">Venta en curso</h3>
              </div>

              {cart.length === 0 ? (
                <CommercialEmptyState
                  icon={ShoppingCart}
                  title="Sin productos agregados"
                  description="Escribe en la búsqueda para agregar productos de la sucursal actual."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-[#FFF9E6]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Precio</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Subtotal</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id} className="border-t border-[#F1F5F9]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#1F2933]">{item.name}</p>
                            <p className="text-xs text-[#6B7280]">{item.sku || "Sin SKU"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              max={String(item.stock)}
                              step="1"
                              value={String(item.quantity)}
                              onChange={(event) => updateCartQuantity(item.id, event.target.value)}
                              className="h-9 w-20 rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 text-[#374151]">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 font-semibold text-[#1F2933]">{formatCurrency(item.price * item.quantity)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#FECACA] bg-[#FFF1F2] text-[#BE123C]"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <div className="grid gap-3">
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#333]">Metodo de pago</span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="h-10 rounded-xl border border-[#E0E0E0] bg-[#FCFCFD] px-3 text-sm text-[#1C1C1C] outline-none"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <Input
                  label="Descuento manual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualDiscount}
                  onChange={(event) => setManualDiscount(event.target.value)}
                  placeholder="0.00"
                />

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[#333]">Observaciones</span>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="rounded-xl border border-[#E0E0E0] bg-[#FCFCFD] px-3 py-2 text-sm text-[#1C1C1C] outline-none"
                    placeholder="Notas opcionales"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-[#FFE9A8] bg-[#FFF8DB] p-4">
              <div className="flex items-center justify-between text-sm text-[#4B5563]">
                <span>Articulos</span>
                <span className="font-semibold text-[#1F2933]">{cartSummary.itemCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1F2933]">{formatCurrency(cartSummary.subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
                <span>Descuento manual</span>
                <span className="font-semibold text-[#1F2933]">{formatCurrency(cartSummary.discount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[#4B5563]">
                <span>Ofertas activas</span>
                <span className="font-semibold text-[#1F2933]">Se aplican al cobrar</span>
              </div>
              <div className="mt-4 rounded-xl bg-[#1F2933] px-4 py-4 text-[#FFEE99]">
                <p className="text-xs uppercase tracking-[0.18em]">Total</p>
                <p className="mt-1 text-3xl font-extrabold">{formatCurrency(cartSummary.total)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <PrimaryButton
                type="button"
                disabled={processingSale || cart.length === 0 || !selectedBranchId}
                onClick={() => setCheckoutOpen(true)}
              >
                <CreditCard size={16} />
                Cobrar
              </PrimaryButton>
              <SecondaryButton type="button" disabled={cart.length === 0} onClick={resetSale}>
                Cancelar venta completa
              </SecondaryButton>
            </div>
          </div>
        </div>
      </section>

      <TicketModal
        sale={ticketSale}
        reprinting={reprinting}
        onClose={() => setTicketSale(null)}
        onReprint={handleReprint}
      />

      <CheckoutModal
        open={checkoutOpen}
        branchName={branches.find((branch) => branch.id === selectedBranchId)?.name || ""}
        paymentMethod={paymentMethod}
        notes={notes}
        subtotal={cartSummary.subtotal}
        discount={cartSummary.discount}
        total={cartSummary.total}
        itemCount={cartSummary.itemCount}
        processingSale={processingSale}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleCreateSale}
      />
    </RoleLayout>
  );
}
