package com.vexperthk.membersystem.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vexperthk.membersystem.ui.auth.ForgotPasswordScreen
import com.vexperthk.membersystem.ui.auth.LoginScreen
import com.vexperthk.membersystem.ui.auth.RegisterScreen
import com.vexperthk.membersystem.ui.components.LoadingView
import com.vexperthk.membersystem.ui.dashboard.DashboardScreen
import com.vexperthk.membersystem.ui.profile.ChangePasswordScreen
import com.vexperthk.membersystem.ui.profile.EditProfileScreen
import com.vexperthk.membersystem.ui.profile.ProfileScreen
import com.vexperthk.membersystem.ui.system.MaintenanceScreen
import com.vexperthk.membersystem.ui.system.UnauthorizedScreen
import com.vexperthk.membersystem.viewmodel.AuthViewModel
import com.vexperthk.membersystem.viewmodel.AdminViewModel

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel
) {
    val isInitialized by authViewModel.isInitialized.collectAsState()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    val isMaintenanceMode by authViewModel.isMaintenanceMode.collectAsState()
    val userStatus by authViewModel.userStatus.collectAsState()

    // State-based navigation interception
    LaunchedEffect(isInitialized, isLoggedIn, isMaintenanceMode, userStatus) {
        if (!isInitialized) return@LaunchedEffect

        val currentRoute = navController.currentBackStackEntry?.destination?.route
        val isAdmin = authViewModel.isAdmin.value

        if (isMaintenanceMode) {
            if (currentRoute != AppRoutes.MAINTENANCE) {
                navController.navigate(AppRoutes.MAINTENANCE) {
                    popUpTo(0) { inclusive = true }
                }
            }
            return@LaunchedEffect
        }

        if (isLoggedIn) {
            when (userStatus) {
                "disabled", "pending" -> {
                    if (currentRoute != AppRoutes.UNAUTHORIZED) {
                        navController.navigate(AppRoutes.UNAUTHORIZED) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
                "active" -> {
                    // Guard against unauthorized non-admins attempting to access admin routes
                    if (!isAdmin && (currentRoute == AppRoutes.ADMIN_DASHBOARD || currentRoute == AppRoutes.ADMIN_MEMBER_DETAILS)) {
                        navController.navigate(AppRoutes.DASHBOARD) {
                            popUpTo(0) { inclusive = true }
                        }
                        return@LaunchedEffect
                    }
                    
                    // Direct admins attempting to access normal dashboard back to admin panel
                    if (isAdmin && currentRoute == AppRoutes.DASHBOARD) {
                        navController.navigate(AppRoutes.ADMIN_DASHBOARD) {
                            popUpTo(0) { inclusive = true }
                        }
                        return@LaunchedEffect
                    }

                    // Safe redirection to appropriate dashboard if on landing/auth pages
                    if (currentRoute == AppRoutes.LOGIN ||
                        currentRoute == AppRoutes.REGISTER ||
                        currentRoute == AppRoutes.FORGOT_PASSWORD ||
                        currentRoute == AppRoutes.MAINTENANCE ||
                        currentRoute == AppRoutes.UNAUTHORIZED ||
                        currentRoute == null
                    ) {
                        val targetRoute = if (isAdmin) AppRoutes.ADMIN_DASHBOARD else AppRoutes.DASHBOARD
                        navController.navigate(targetRoute) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            }
        } else {
            // Not logged in -> go to login if not already on login/register/forgot_password
            if (currentRoute != AppRoutes.LOGIN &&
                currentRoute != AppRoutes.REGISTER &&
                currentRoute != AppRoutes.FORGOT_PASSWORD
            ) {
                navController.navigate(AppRoutes.LOGIN) {
                    popUpTo(0) { inclusive = true }
                }
            }
        }
    }

    if (!isInitialized) {
        LoadingView()
        return
    }

    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) {
            if (isMaintenanceMode) AppRoutes.MAINTENANCE
            else if (userStatus == "disabled" || userStatus == "pending") AppRoutes.UNAUTHORIZED
            else if (authViewModel.isAdmin.value) AppRoutes.ADMIN_DASHBOARD
            else AppRoutes.DASHBOARD
        } else {
            AppRoutes.LOGIN
        }
    ) {
        composable(AppRoutes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    // Handled by state listener
                },
                onNavigateToRegister = {
                    navController.navigate(AppRoutes.REGISTER)
                },
                onNavigateToForgotPassword = {
                    navController.navigate(AppRoutes.FORGOT_PASSWORD)
                }
            )
        }

        composable(AppRoutes.REGISTER) {
            RegisterScreen(
                onRegisterSuccess = {
                    // Handled by state listener
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable(AppRoutes.FORGOT_PASSWORD) {
            ForgotPasswordScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(AppRoutes.DASHBOARD) {
            DashboardScreen(
                onNavigateToProfile = {
                    navController.navigate(AppRoutes.PROFILE)
                },
                onNavigateToEditProfile = {
                    navController.navigate(AppRoutes.EDIT_PROFILE)
                },
                onNavigateToChangePassword = {
                    navController.navigate(AppRoutes.CHANGE_PASSWORD)
                },
                viewModel = authViewModel
            )
        }

        composable(AppRoutes.PROFILE) {
            ProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToEdit = {
                    navController.navigate(AppRoutes.EDIT_PROFILE)
                }
            )
        }

        composable(AppRoutes.EDIT_PROFILE) {
            EditProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(AppRoutes.CHANGE_PASSWORD) {
            ChangePasswordScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onLogout = {
                    authViewModel.logout()
                }
            )
        }

        composable(AppRoutes.MAINTENANCE) {
            MaintenanceScreen(
                onLogout = {
                    authViewModel.logout()
                }
            )
        }

        composable(AppRoutes.UNAUTHORIZED) {
            UnauthorizedScreen(
                status = userStatus ?: "pending",
                onLogout = {
                    authViewModel.logout()
                }
            )
        }

        composable(AppRoutes.ADMIN_DASHBOARD) {
            val adminViewModel: AdminViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            com.vexperthk.membersystem.ui.admin.AdminLiteDashboardScreen(
                onNavigateToDetails = {
                    navController.navigate(AppRoutes.ADMIN_MEMBER_DETAILS)
                },
                onLogout = {
                    authViewModel.logout()
                },
                viewModel = adminViewModel
            )
        }

        composable(AppRoutes.ADMIN_MEMBER_DETAILS) {
            val backStackEntry = remember(it) {
                navController.getBackStackEntry(AppRoutes.ADMIN_DASHBOARD)
            }
            val adminViewModel: AdminViewModel = androidx.lifecycle.viewmodel.compose.viewModel(backStackEntry)
            com.vexperthk.membersystem.ui.admin.AdminMemberDetailsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                viewModel = adminViewModel
            )
        }
    }
}
