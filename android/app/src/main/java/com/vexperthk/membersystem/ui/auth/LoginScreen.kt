package com.vexperthk.membersystem.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vexperthk.membersystem.ui.components.AppButton
import com.vexperthk.membersystem.ui.components.AppTextField
import com.vexperthk.membersystem.ui.components.ErrorView
import com.vexperthk.membersystem.ui.theme.Slate50
import com.vexperthk.membersystem.ui.theme.Slate100
import com.vexperthk.membersystem.ui.theme.Slate200
import com.vexperthk.membersystem.ui.theme.Slate400
import com.vexperthk.membersystem.ui.theme.Slate500
import com.vexperthk.membersystem.ui.theme.Slate700
import com.vexperthk.membersystem.ui.theme.Slate900
import com.vexperthk.membersystem.BuildConfig
import com.vexperthk.membersystem.viewmodel.LoginViewModel

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit,
    onNavigateToForgotPassword: () -> Unit,
    viewModel: LoginViewModel = viewModel()
) {
    val email by viewModel.email.collectAsState()
    val password by viewModel.password.collectAsState()
    val error by viewModel.error.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate50),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.primary)
                    .padding(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.height(32.dp).width(32.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "歡迎回來",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )
            Text(
                text = "請登入您的帳戶以存取會員管理系統",
                fontSize = 14.sp,
                color = Slate500,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(32.dp))

            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    ErrorView(message = error, modifier = Modifier.padding(bottom = 16.dp))

                    AppTextField(
                        value = email,
                        onValueChange = { viewModel.setEmail(it) },
                        label = "電子郵件",
                        placeholder = "example@mail.com",
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Email,
                                contentDescription = null,
                                tint = Slate400
                            )
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    AppTextField(
                        value = password,
                        onValueChange = { viewModel.setPassword(it) },
                        label = "密碼",
                        placeholder = "••••••••",
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = Slate400
                            )
                        },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = onNavigateToForgotPassword) {
                            Text(
                                text = "忘記密碼？",
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    AppButton(
                        onClick = { viewModel.login(onLoginSuccess) },
                        isLoading = isLoading
                    ) {
                        Text(
                            text = "登入系統",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (BuildConfig.DEBUG) {
                        Spacer(modifier = Modifier.height(24.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Divider(modifier = Modifier.weight(1f), color = Slate200)
                            Text(
                                text = "快速登入 (測試通道)",
                                color = Slate400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            Divider(modifier = Modifier.weight(1f), color = Slate200)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(modifier = Modifier.fillMaxWidth()) {
                            AppButton(
                                onClick = { viewModel.quickLogin("admin@vexperthk.com", "123456", onLoginSuccess) },
                                containerColor = Color(0xFFF3E8FF),
                                contentColor = Color(0xFF7E22CE),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("👑 管理員", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            AppButton(
                                onClick = { viewModel.quickLogin("test@vexperthk.com", "123456", onLoginSuccess) },
                                containerColor = Slate100,
                                contentColor = Slate700,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("👤 一般會員", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        AppButton(
                            onClick = { viewModel.quickLogin("disable@vexperthk.com", "123456", onLoginSuccess) },
                            containerColor = Color(0xFFFFE4E6),
                            contentColor = Color(0xFFBE123C)
                        ) {
                            Text("🚫 內部停用測試", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "還沒有帳戶？", color = Slate500, fontSize = 14.sp)
                        TextButton(onClick = onNavigateToRegister) {
                            Text(
                                text = "立即註冊",
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
