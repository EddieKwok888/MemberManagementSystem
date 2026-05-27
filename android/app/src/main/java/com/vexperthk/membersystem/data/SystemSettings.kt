package com.vexperthk.membersystem.data

data class SystemSettings(
    val maintenanceMode: Boolean = false,
    val allowPublicRegistration: Boolean = true,
    val defaultMemberStatus: String = "pending"
)
