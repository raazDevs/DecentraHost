import { db } from "./dbConfig";

import { Users, Webpages,  Deployments } from "./schema";
import { eq, sql, desc } from "drizzle-orm";
import { create } from "@web3-storage/w3up-client";
import { ethers } from "ethers";

export async function createOrUpdateUser(address: string, email: string) {
    try {
      const existingUser = await db
        .select()
        .from(Users)
        .where(eq(Users.address, address))
        .execute();
  
      const now = new Date();
  
      if (existingUser.length > 0) {
        const [updatedUser] = await db
          .update(Users)
          .set({
            email,
            updatedAt: now,
            lastLogin: now,
          })
          .where(eq(Users.address, address))
          .returning()
          .execute();
        return updatedUser;
      } else {
        const [newUser] = await db
          .insert(Users)
          .values({
            address,
            email,
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
          })
          .returning()
          .execute();
  
      
          
  
        return newUser;
      }
    } catch (error) {
      console.error("Error creating or updating user:", error);
      return null;
    }
  }

  let web3StorageClient: any;

  export async function initializeClients(userEmail: string) {
    web3StorageClient = await create();
  
    // Authenticate and select a space using the user's email
    await web3StorageClient.login(userEmail);
    const spaces = await web3StorageClient.spaces();
    if (spaces.length > 0) {
      await web3StorageClient.setCurrentSpace(spaces[0].did());
    } else {
      throw new Error("No spaces available. Please create a space first.");
    }
  
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc.bittorrentchain.i"
    );
    const signer = new ethers.Wallet(
      "2f34d72c40a47e574ed54bbd14723d7753e8cf53434a180f67ef2f73187ef811",
      provider
    );
    contract = new ethers.Contract(
      "0x4eEAEB9C96951Fc1BE43f34c42A002B58FB774Ff",
      WebpageStorageABI.abi,
      signer
    );
  }