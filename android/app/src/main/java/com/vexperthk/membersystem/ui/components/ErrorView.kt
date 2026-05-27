package com.vexperthk.membersystem.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexperthk.membersystem.ui.theme.Rose50
import com.vexperthk.membersystem.ui.theme.Rose700

@Composable
fun ErrorView(
    message: String,
    modifier: Modifier = Modifier
) {
    if (message.isEmpty()) return
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Rose50)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Text(
            text = message,
            color = Rose700,
            fontSize = 14.sp
        )
    }
}
