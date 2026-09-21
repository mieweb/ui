plugins {
    kotlin("multiplatform")
    kotlin("plugin.compose")
    id("org.jetbrains.compose")
    id("com.android.kotlin.multiplatform.library")
}

kotlin {
    androidLibrary {
        namespace = "com.mieweb.ui.compose"
        compileSdk = 36
        minSdk = 28
        androidResources.enable = true
    }
    iosArm64()
    iosSimulatorArm64()
    jvmToolchain(17)
    sourceSets {
        commonMain.dependencies {
            api(compose.material3)
            implementation(compose.components.resources)
        }
    }
}

compose.resources {
    packageOfResClass = "com.mieweb.ui.native.resources"
}