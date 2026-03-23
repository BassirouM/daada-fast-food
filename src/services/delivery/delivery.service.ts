import { supabase } from '@/lib/supabase'
import type { DeliveryAddress, DeliveryZone } from '@/types/delivery'

export const deliveryService = {
  async getUserAddresses(userId: string): Promise<DeliveryAddress[]> {
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })

    if (error) throw new Error(error.message)
    return data as DeliveryAddress[]
  },

  async addAddress(
    address: Omit<DeliveryAddress, 'id'>
  ): Promise<DeliveryAddress> {
    // If setting as default, unset other defaults first
    if (address.is_default) {
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('user_id', address.user_id)
    }

    const { data, error } = await supabase
      .from('delivery_addresses')
      .insert(address)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as DeliveryAddress
  },

  async deleteAddress(addressId: string): Promise<void> {
    const { error } = await supabase
      .from('delivery_addresses')
      .delete()
      .eq('id', addressId)

    if (error) throw new Error(error.message)
  },

  async getActiveZones(): Promise<DeliveryZone[]> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)

    if (error) throw new Error(error.message)
    return data as DeliveryZone[]
  },

  async getZoneForQuartier(quartier: string): Promise<DeliveryZone | null> {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .contains('quartiers', [quartier])
      .eq('is_active', true)
      .single()

    if (error) return null
    return data as DeliveryZone
  },

  async estimateDeliveryFee(addressId: string): Promise<number> {
    const { data: address } = await supabase
      .from('delivery_addresses')
      .select('quartier')
      .eq('id', addressId)
      .single()

    if (!address) return 500 // Default fee in XAF

    const zone = await deliveryService.getZoneForQuartier(address.quartier)
    return zone?.delivery_fee ?? 500
  },
}
