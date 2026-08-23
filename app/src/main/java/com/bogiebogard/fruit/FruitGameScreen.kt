package com.bogiebogard.fruit

import android.app.Activity
import android.content.pm.ActivityInfo
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlin.math.sqrt
import kotlin.random.Random

data class FruitBody(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    var level: Int
)

private val fruitColors = listOf(
    Color(0xFFFF6B6B),
    Color(0xFFFFB84D),
    Color(0xFFFFE66D),
    Color(0xFF7BD389),
    Color(0xFF5CC8FF),
    Color(0xFFB892FF),
    Color(0xFFFF88C2),
    Color(0xFF72D572)
)

private fun radiusFor(level: Int): Float = 24f + level * 10f

@Composable
fun FruitGameScreen() {
    val context = LocalContext.current
    val activity = context as? Activity
    val configuration = LocalConfiguration.current
    val unfoldedCandidate = configuration.screenWidthDp >= 600

    val fruits = remember { mutableStateListOf<FruitBody>() }
    var score by remember { mutableIntStateOf(0) }
    var nextLevel by remember { mutableIntStateOf(0) }
    var boardWidth by remember { mutableStateOf(1f) }
    var boardHeight by remember { mutableStateOf(1f) }

    LaunchedEffect(Unit) {
        while (true) {
            val dt = 1f / 60f
            val gravity = 1100f
            val floor = boardHeight - 18f
            val left = 12f
            val right = boardWidth - 12f

            fruits.forEach { f ->
                f.vy += gravity * dt
                f.x += f.vx * dt
                f.y += f.vy * dt
                val r = radiusFor(f.level)
                if (f.x - r < left) { f.x = left + r; f.vx *= -0.45f }
                if (f.x + r > right) { f.x = right - r; f.vx *= -0.45f }
                if (f.y + r > floor) { f.y = floor - r; f.vy *= -0.28f; f.vx *= 0.985f }
            }

            loop@ for (i in 0 until fruits.size) {
                for (j in i + 1 until fruits.size) {
                    val a = fruits[i]
                    val b = fruits[j]
                    val dx = b.x - a.x
                    val dy = b.y - a.y
                    val dist = sqrt(dx * dx + dy * dy).coerceAtLeast(0.001f)
                    val minDist = radiusFor(a.level) + radiusFor(b.level)
                    if (dist < minDist) {
                        if (a.level == b.level && a.level < fruitColors.lastIndex) {
                            val level = a.level + 1
                            fruits.removeAt(j)
                            fruits.removeAt(i)
                            fruits.add(
                                FruitBody(
                                    x = (a.x + b.x) / 2f,
                                    y = (a.y + b.y) / 2f,
                                    vx = (a.vx + b.vx) / 2f,
                                    vy = (a.vy + b.vy) / 2f - 110f,
                                    level = level
                                )
                            )
                            score += (level + 1) * 10
                            break@loop
                        } else {
                            val overlap = minDist - dist
                            val nx = dx / dist
                            val ny = dy / dist
                            a.x -= nx * overlap * 0.5f
                            a.y -= ny * overlap * 0.5f
                            b.x += nx * overlap * 0.5f
                            b.y += ny * overlap * 0.5f
                            a.vx -= nx * 30f
                            b.vx += nx * 30f
                        }
                    }
                }
            }
            delay(16)
        }
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF10141B))
    ) {
        val wideLayout = maxWidth > maxHeight

        if (wideLayout) {
            GameArena(
                fruits = fruits,
                nextLevel = nextLevel,
                onDrop = { x, width ->
                    val r = radiusFor(nextLevel)
                    val safeX = x.coerceIn(r + 8f, width - r - 8f)
                    fruits.add(FruitBody(safeX, r + 8f, Random.nextFloat() * 20f - 10f, 0f, nextLevel))
                    nextLevel = if (Random.nextFloat() < 0.78f) 0 else 1
                },
                onBoardSize = { w, h -> boardWidth = w; boardHeight = h },
                modifier = Modifier.fillMaxSize().padding(start = 210.dp, top = 12.dp, end = 12.dp, bottom = 12.dp)
            )

            Column(
                modifier = Modifier
                    .width(210.dp)
                    .fillMaxHeight()
                    .padding(18.dp)
            ) {
                Text("FRUIT LAB", color = Color.White)
                Text("Score $score", color = Color.White, modifier = Modifier.padding(top = 12.dp))
                Text("Next: ${nextLevel + 1}", color = Color(0xFFCBD5E1), modifier = Modifier.padding(top = 8.dp))
                Button(
                    onClick = { fruits.clear(); score = 0 },
                    modifier = Modifier.padding(top = 18.dp)
                ) { Text("Restart") }
                if (unfoldedCandidate) {
                    Button(
                        onClick = { activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED },
                        modifier = Modifier.padding(top = 10.dp)
                    ) { Text("Auto rotate") }
                }
            }
        } else {
            GameArena(
                fruits = fruits,
                nextLevel = nextLevel,
                onDrop = { x, width ->
                    val r = radiusFor(nextLevel)
                    val safeX = x.coerceIn(r + 8f, width - r - 8f)
                    fruits.add(FruitBody(safeX, r + 8f, Random.nextFloat() * 20f - 10f, 0f, nextLevel))
                    nextLevel = if (Random.nextFloat() < 0.78f) 0 else 1
                },
                onBoardSize = { w, h -> boardWidth = w; boardHeight = h },
                modifier = Modifier.fillMaxSize().padding(top = 72.dp, start = 12.dp, end = 12.dp, bottom = 76.dp)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 22.dp)
            ) {
                Text("FRUIT LAB", color = Color.White)
                Text("   Score $score", color = Color.White)
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 14.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth()) {
                    Button(onClick = { fruits.clear(); score = 0 }) { Text("Restart") }
                    if (unfoldedCandidate) {
                        Button(
                            onClick = { activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE },
                            modifier = Modifier.padding(start = 10.dp)
                        ) { Text("Use wide Fold") }
                    }
                }
            }
        }
    }
}

@Composable
private fun GameArena(
    fruits: List<FruitBody>,
    nextLevel: Int,
    onDrop: (x: Float, width: Float) -> Unit,
    onBoardSize: (width: Float, height: Float) -> Unit,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .background(Color(0xFF171D27))
            .pointerInput(nextLevel) {
                detectTapGestures { p -> onDrop(p.x, size.width.toFloat()) }
            }
    ) {
        onBoardSize(size.width, size.height)
        drawLine(
            color = Color(0x66FFFFFF),
            start = Offset(0f, 110f),
            end = Offset(size.width, 110f),
            strokeWidth = 2f
        )
        fruits.forEach { f ->
            val r = radiusFor(f.level)
            drawCircle(fruitColors[f.level], r, Offset(f.x, f.y))
            drawCircle(Color.White.copy(alpha = 0.65f), r * 0.12f, Offset(f.x - r * 0.28f, f.y - r * 0.22f))
            drawCircle(Color.Black.copy(alpha = 0.45f), r * 0.06f, Offset(f.x - r * 0.18f, f.y + r * 0.02f))
            drawCircle(Color.Black.copy(alpha = 0.45f), r * 0.06f, Offset(f.x + r * 0.18f, f.y + r * 0.02f))
        }
        val previewR = radiusFor(nextLevel)
        drawCircle(fruitColors[nextLevel].copy(alpha = 0.5f), previewR, Offset(size.width / 2f, previewR + 8f))
    }
}
