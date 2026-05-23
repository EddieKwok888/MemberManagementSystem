package com.vexperthk.membersystem.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.functions.FirebaseFunctions
import com.vexperthk.membersystem.data.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class UserRepository {
    private val firestore = FirebaseFirestore.getInstance()
    private val functions = FirebaseFunctions.getInstance()

    fun observeUser(uid: String): Flow<User?> = callbackFlow {
        val docRef = firestore.collection("users").document(uid)
        val registration = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            if (snapshot != null && snapshot.exists()) {
                val user = try {
                    snapshot.toObject(User::class.java)
                } catch (e: Exception) {
                    // Safe manual parsing fallback to prevent deserialization type-mismatch crashes (e.g. String vs Timestamp)
                    try {
                        val uidVal = snapshot.getString("uid") ?: ""
                        val email = snapshot.getString("email") ?: ""
                        val displayName = snapshot.getString("displayName") ?: ""
                        val realName = snapshot.getString("realName") ?: ""
                        val phone = snapshot.getString("phone") ?: ""
                        val address = snapshot.getString("address") ?: ""
                        val role = snapshot.getString("role") ?: "member"
                        val status = snapshot.getString("status") ?: "pending"
                        
                        val createdAt = try {
                            snapshot.getTimestamp("createdAt")
                        } catch (ex: Exception) {
                            val raw = snapshot.get("createdAt")
                            if (raw is com.google.firebase.Timestamp) raw
                            else if (raw is java.util.Date) com.google.firebase.Timestamp(raw)
                            else null
                        }

                        val updatedAt = try {
                            snapshot.getTimestamp("updatedAt")
                        } catch (ex: Exception) {
                            val raw = snapshot.get("updatedAt")
                            if (raw is com.google.firebase.Timestamp) raw
                            else if (raw is java.util.Date) com.google.firebase.Timestamp(raw)
                            else null
                        }

                        User(uidVal, email, displayName, realName, phone, address, role, status, createdAt, updatedAt)
                    } catch (ex: Exception) {
                        null
                    }
                }
                trySend(user)
            } else {
                trySend(null)
            }
        }
        awaitClose { registration.remove() }
    }

    suspend fun getUser(uid: String): User? {
        val snapshot = firestore.collection("users").document(uid).get().await()
        return if (snapshot.exists()) {
            try {
                snapshot.toObject(User::class.java)
            } catch (e: Exception) {
                try {
                    val uidVal = snapshot.getString("uid") ?: ""
                    val email = snapshot.getString("email") ?: ""
                    val displayName = snapshot.getString("displayName") ?: ""
                    val realName = snapshot.getString("realName") ?: ""
                    val phone = snapshot.getString("phone") ?: ""
                    val address = snapshot.getString("address") ?: ""
                    val role = snapshot.getString("role") ?: "member"
                    val status = snapshot.getString("status") ?: "pending"
                    
                    val createdAt = try {
                        snapshot.getTimestamp("createdAt")
                    } catch (ex: Exception) {
                        val raw = snapshot.get("createdAt")
                        if (raw is com.google.firebase.Timestamp) raw
                        else if (raw is java.util.Date) com.google.firebase.Timestamp(raw)
                        else null
                    }

                    val updatedAt = try {
                        snapshot.getTimestamp("updatedAt")
                    } catch (ex: Exception) {
                        val raw = snapshot.get("updatedAt")
                        if (raw is com.google.firebase.Timestamp) raw
                        else if (raw is java.util.Date) com.google.firebase.Timestamp(raw)
                        else null
                    }

                    User(uidVal, email, displayName, realName, phone, address, role, status, createdAt, updatedAt)
                } catch (ex: Exception) {
                    null
                }
            }
        } else {
            null
        }
    }

    suspend fun syncRegistration(uid: String, email: String, displayName: String, defaultStatus: String) {
        // Wait 1.5 seconds for Firestore sync/cloud functions to trigger initial setup
        kotlinx.coroutines.delay(1500)

        val docRef = firestore.collection("users").document(uid)
        val snapshot = docRef.get().await()

        if (snapshot.exists()) {
            // Document already exists (e.g. from cloud functions), update realName and displayName
            val updates = hashMapOf(
                "displayName" to displayName,
                "realName" to displayName
            )
            docRef.set(updates, SetOptions.merge()).await()
        } else {
            // Write whole document
            val newUser = hashMapOf(
                "uid" to uid,
                "email" to email,
                "displayName" to displayName,
                "realName" to displayName,
                "role" to "member",
                "status" to defaultStatus,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(newUser).await()
        }
    }

    suspend fun updateProfile(
        uid: String,
        realName: String,
        phone: String,
        address: String,
        changedFields: Map<String, Any>
    ) {
        val docRef = firestore.collection("users").document(uid)
        val updates = hashMapOf(
            "realName" to realName,
            "displayName" to realName,
            "phone" to phone,
            "address" to address,
            "updatedAt" to FieldValue.serverTimestamp()
        )

        // 1. Update Firestore users collection
        docRef.set(updates, SetOptions.merge()).await()

        // 2. Call Cloud Function to log action and update memberProfiles collection
        if (changedFields.isNotEmpty()) {
            val data = hashMapOf(
                "uid" to uid,
                "updates" to changedFields
            )
            functions.getHttpsCallable("updateMemberProfile")
                .call(data)
                .await()
        }
    }

    fun observeAllUsers(): Flow<List<User>> = callbackFlow {
        val registration = firestore.collection("users")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val list = snapshot.documents.mapNotNull { doc ->
                        try {
                            doc.toObject(User::class.java)
                        } catch (e: Exception) {
                            try {
                                val uidVal = doc.getString("uid") ?: ""
                                val email = doc.getString("email") ?: ""
                                val displayName = doc.getString("displayName") ?: ""
                                val realName = doc.getString("realName") ?: ""
                                val phone = doc.getString("phone") ?: ""
                                val address = doc.getString("address") ?: ""
                                val role = doc.getString("role") ?: "member"
                                val status = doc.getString("status") ?: "pending"
                                
                                val createdAt = try { doc.getTimestamp("createdAt") } catch (ex: Exception) { null }
                                val updatedAt = try { doc.getTimestamp("updatedAt") } catch (ex: Exception) { null }

                                User(uidVal, email, displayName, realName, phone, address, role, status, createdAt, updatedAt)
                            } catch (ex: Exception) {
                                null
                            }
                        }
                    }
                    trySend(list)
                }
            }
        awaitClose { registration.remove() }
    }

    suspend fun updateMemberStatus(uid: String, newStatus: String) {
        firestore.collection("users").document(uid)
            .update(
                "status", newStatus,
                "updatedAt", FieldValue.serverTimestamp()
            ).await()
    }
}
