import { localCacheService } from './../services/local-cache.service';
import { Injectable } from '@angular/core';
import { createStore } from '@ngneat/elf';
import { deleteAllEntities, hasEntity, withEntities } from '@ngneat/elf-entities';
import { HopReturnItems } from '../entities/returns';
import { TripListMappedResponse } from '../entities/trip';

export interface HopReturnsCache {
    hopId: string;
    returnOrders: HopReturnItems[];
    hopAttemptHistoryId: string;
    // tripInfo: TripListMappedResponse;
}


export const returnStore = createStore(
    { name: 'return' },
    withEntities<HopReturnsCache, 'hopId'>({ idKey: 'hopId', initialValue: [] }),
);

@Injectable({ providedIn: 'root' })
export class ReturnRepository {
    [x: string]: any;

    constructor(private localCache: localCacheService) {

    }

    async addReturn(returnItem: HopReturnsCache) {
        //returnStore.update(upsertEntities(returnItem));
        await this.localCache.set(returnItem.hopId, returnItem);
    }

    async updateReturn(returnItem: HopReturnsCache) {
        //returnStore.update(updateEntities(returnItem.hopId, returnItem));
        await this.localCache.set(returnItem.hopId, returnItem);
    }

    async getReturnById(id: string): Promise<HopReturnsCache> {
        // return returnStore.getValue().entities[id];
        return await this.localCache.get(id);
    }

    hasReturn(id: string) {
        return returnStore.query(hasEntity(id));
    }

    deleteStoreReturns() {
        returnStore.update(deleteAllEntities());
        // need to delete
    }

    async deleteCacheReturnByHopId(hopId: string) {
        await this.localCache.remove(hopId);
    }

    async getAllReturns(): Promise<HopReturnsCache[] | []> {
        const allData = await this.localCache.getAll();
        return allData.map(item => ({
            hopId: item.key,
            returnOrders: item.value.returnOrders,
            tripInfo: item.value.tripInfo,
            hopAttemptHistoryId: item.value.hopAttemptHistoryId
        }));
    }

    async upsertStoreReturn(returnItem: HopReturnsCache) {
        const existingReturn = await this.getReturnById(returnItem.hopId);

        if (existingReturn) {
            const updatedOrders = [...existingReturn.returnOrders];

            // Iterate over new return orders
            returnItem.returnOrders.forEach((newOrder) => {
                const existingOrderIndex = updatedOrders.findIndex(
                    (order) =>
                        order.orderNumber === newOrder.orderNumber &&
                        order.itemId === newOrder.itemId &&
                        order.vendorId === newOrder.vendorId
                );

                if (existingOrderIndex !== -1) {
                    // Update existing order
                    const existingOrder = updatedOrders[existingOrderIndex];
                    updatedOrders[existingOrderIndex] = {
                        ...existingOrder,
                        quantity: existingOrder.quantity + newOrder.quantity,
                        totalNetAmount: existingOrder.totalNetAmount + newOrder.totalNetAmount,
                        pieces: existingOrder.pieces + newOrder.pieces,
                        cases: existingOrder.cases + newOrder.cases,
                        newCouponDiscountAmount: existingOrder.newCouponDiscountAmount + newOrder.newCouponDiscountAmount,
                    };
                } else {
                    // Add new order
                    updatedOrders.push(newOrder);
                }
            });
            console.log("updatedOrders", updatedOrders);
            // Update the store with the merged orders

            const updatedReturn: HopReturnsCache = {
                hopId: existingReturn.hopId,
                returnOrders: updatedOrders,
                hopAttemptHistoryId: existingReturn?.hopAttemptHistoryId || '',
                // tripInfo: existingReturn.tripInfo
            };

            await this.updateReturn(updatedReturn);
        } else {
            // If no existing return, add a new entry
            await this.addReturn(returnItem);
        }
    }



}
