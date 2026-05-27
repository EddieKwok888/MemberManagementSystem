package com.vexperthk.membersystem.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.userProfileChangeRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.tasks.await

class AuthRepository {
    private val auth = FirebaseAuth.getInstance()

    private val _currentUser = MutableStateFlow<FirebaseUser?>(auth.currentUser)
    val currentUser: StateFlow<FirebaseUser?> = _currentUser

    init {
        auth.addAuthStateListener { firebaseAuth ->
            _currentUser.value = firebaseAuth.currentUser
        }
    }

    suspend fun login(email: String, password: String): FirebaseUser {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        return result.user ?: throw Exception("User is null after successful login")
    }

    suspend fun register(email: String, password: String, displayName: String): FirebaseUser {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val user = result.user ?: throw Exception("User is null after successful registration")
        val profileUpdates = userProfileChangeRequest {
            this.displayName = displayName
        }
        user.updateProfile(profileUpdates).await()
        return user
    }

    suspend fun sendPasswordReset(email: String) {
        auth.sendPasswordResetEmail(email).await()
    }

    suspend fun updatePassword(newPassword: String) {
        val user = auth.currentUser ?: throw Exception("No authenticated user found")
        user.updatePassword(newPassword).await()
    }

    fun logout() {
        auth.signOut()
    }
}
