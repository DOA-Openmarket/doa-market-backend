import { Request, Response } from 'express';
import Address from '../models/address.model';
import { z } from 'zod';

const addressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(1),
  zipCode: z.string().min(1),
  address: z.string().min(1),
  addressDetail: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const addresses = await Address.findAll({ where: { userId }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validationResult = addressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: validationResult.error.errors });
    }

    const data = validationResult.data;

    if (data.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const address = await Address.create({ ...data, userId });
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const { userId, addressId } = req.params;
    const validationResult = addressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: validationResult.error.errors });
    }

    const data = validationResult.data;

    if (data.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const [updated] = await Address.update(data, { where: { addressId, userId } });
    if (!updated) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const address = await Address.findByPk(addressId);
    res.json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { userId, addressId } = req.params;
    const deleted = await Address.destroy({ where: { addressId, userId } });
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
