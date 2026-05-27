package com.vexperthk.membersystem.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.vexperthk.membersystem.data.SystemSettings
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class SystemRepository {
    private val firestore = FirebaseFirestore.getInstance()

    fun observeSettings(): Flow<SystemSettings?> = callbackFlow {
        val docRef = firestore.collection("systemSettings").document("config")
        val registration = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            if (snapshot != null && snapshot.exists()) {
                val settings = snapshot.toObject(SystemSettings::class.java)
                trySend(settings)
            } else {
                trySend(null)
            }
        }
        awaitClose { registration.remove() }
    }

    suspend fun getSettings(): SystemSettings? {
        val snapshot = firestore.collection("systemSettings").document("config").get().await()
        return if (snapshot.exists()) {
            snapshot.toObject(SystemSettings::class.java)
        } else {
            null
        }
    }
}
