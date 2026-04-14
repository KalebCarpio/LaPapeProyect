import {
  createOfferPrisma,
  getOfferPrisma,
  listOffersPrisma,
  toggleOfferStatusPrisma,
  updateOfferPrisma,
} from "../services/offer.service.js";

export const listOffers = async (_req, res) => {
  try {
    const items = await listOffersPrisma();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudieron listar las ofertas" });
  }
};

export const getOffer = async (req, res) => {
  try {
    const item = await getOfferPrisma(req.params.id);
    if (!item) return res.status(404).json({ message: "Oferta no encontrada" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo obtener la oferta" });
  }
};

export const createOffer = async (req, res) => {
  try {
    const created = await createOfferPrisma(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo crear la oferta" });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const existing = await getOfferPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Oferta no encontrada" });

    const item = await updateOfferPrisma(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo actualizar la oferta" });
  }
};

export const toggleOfferStatus = async (req, res) => {
  try {
    const existing = await getOfferPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Oferta no encontrada" });

    const item = await toggleOfferStatusPrisma(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo cambiar el estado de la oferta" });
  }
};
