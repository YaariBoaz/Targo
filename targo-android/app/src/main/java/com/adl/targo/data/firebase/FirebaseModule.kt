package com.adl.targo.data.firebase

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.FirebaseFirestore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object FirebaseModule {

    private const val LAHAV_APP_NAME = "lahav-backoffice"

    @Provides
    @Singleton
    @Named("lahav")
    fun provideLahavFirestore(@ApplicationContext context: Context): FirebaseFirestore {
        val lahavOptions = FirebaseOptions.Builder()
            .setApiKey("AIzaSyDybPgI2iaggYJSTtICrThM1Y1f8QKOX4U")
            .setProjectId("lahav-backoffice")
            .setApplicationId("1:1094873661427:android:e5e22d83d6daf8112f9c86")
            .setStorageBucket("lahav-backoffice.firebasestorage.app")
            .setGcmSenderId("1094873661427")
            .build()

        val lahavApp = try {
            FirebaseApp.initializeApp(context, lahavOptions, LAHAV_APP_NAME)
        } catch (e: IllegalStateException) {
            FirebaseApp.getInstance(LAHAV_APP_NAME)
        }

        return FirebaseFirestore.getInstance(lahavApp)
    }
}
