package com.vexperthk.membersystem

import android.app.Application
import com.google.firebase.FirebaseApp

class MemberSystemApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Live Firebase
        FirebaseApp.initializeApp(this)
    }
}
