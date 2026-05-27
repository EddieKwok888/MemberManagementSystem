package com.vexperthk.membersystem.data

import com.google.firebase.Timestamp

data class User(
    val uid: String? = "",
    val email: String? = "",
    val displayName: String? = "",
    val realName: String? = "",
    val phone: String? = "",
    val address: String? = "",
    val role: String? = "member",
    val status: String? = "pending",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)
