---
title: "牛顿运动定律的应用③｜牛顿运动定律的应用③｜15 题分层自测：从正交分解到分阶段过程"
description: "第四章 4.5 分层练习篇：15 道题按概念辨析、基础应用、提升与综合三层编排，覆盖已知力求运动、已知运动求力、斜面动力学、分阶段过程与连接体五类题型，文末按题号给出答案、依据与检查，本单元自闭环。"
pubDate: 2026-10-28
draft: false
tags: ["力学", "牛顿运动定律", "练习"]
mathjax: true
---

框架在①、路径在②，这篇检验五件事：$a$ 这座桥两个方向都会走吗，斜面上的两套方程熟吗，力中途变了会分段吗，连接体会选整体还是隔离吗，临界条件会检验吗。15 道题按学习目标分三层，做完再翻文末答案区，每题按"答案—依据—检查"给全，答案区在本单元内自闭环。

:::usage
- 对应教材：人教版必修第一册 第四章 5 节 牛顿运动定律的应用。
- 本篇类型：本单元练习篇。
- 前置知识：主讲篇《牛顿运动定律的应用①》的框架与斜面两式，方法篇《牛顿运动定律的应用②》的五类题型路径。
- 学习目标：按层检验——概念与方向判断（A）、五类题型的基础流程（B）、多过程与多物体的综合（C）。
- 使用规则：先独立完成再对答案；每题给自己标 ✓、△、✗，△ 和 ✗ 回到对应讲解位置重做一遍。
:::


## 用法与分层说明

:::usage

- 第 1–5 题　概念辨析（必做）：两类问题的方向、合力与运动状态的对应。
- 第 6–10 题　基础应用（必做）：斜面、连接体与两阶段计算的固定流程。
- 第 11–15 题　提升与综合（第 11–14 题推荐完成，第 15 题选做）：分阶段、多物体与几何约束的组合。
- 题型分布：单选题 9 道（第 1–7、9、15 题），多选题 3 道（第 10、11、13 题），计算题 3 道（第 8、12、14 题）。
- 知识边界：全程不涉及能量分析；第 11、13 题的判断只用牛顿第二定律和摩擦力知识；第 15 题需要一点对称几何，标为选做。

:::

## A 概念辨析（第 1–5 题，必做）

:::problem
<span class="prob-grade">1.【基础题·常考题·选择题】</span><span class="prob-source">（2022 年江苏卷，据真题汇编标注）</span>高铁车厢里的水平桌面上放置一本书，书与桌面间的动摩擦因数为 0.4，最大静摩擦力等于滑动摩擦力，取重力加速度 $g = 10$ m/s²。若书不滑动，则高铁的最大加速度不超过（　）

![高铁车厢内，水平桌面上放着一本书，列车向右加速](/blog-images/k016-newton-laws-applications/fig-q4-train-book.png)

图 1｜随列车加速的桌面与书

　　A. 2.0 m/s²

　　B. 4.0 m/s²

　　C. 6.0 m/s²

　　D. 8.0 m/s²
:::

:::problem
<span class="prob-grade">2.【基础题·易错题·选择题】</span><span class="prob-source">（题库《力学选择题集粹》第 94 题；原扫描图过小，按配图说明自绘）</span>如图所示，水平地面上放一质量为 m 的物体，在与水平方向成 θ 角的拉力 F 作用下处于静止状态，已知物体与地面间的动摩擦因数为 μ，则地面对物体的摩擦力大小为（　）

![质量 m 的物体在水平地面上保持静止，拉力 F 与水平方向成 θ 角](/blog-images/k016-newton-laws-applications/fig-q94-pull-static.png)

图 2｜受斜向拉力而静止的物体

　　A. $\mu mg$

　　B. $\mu\left( mg - F\cos\theta \right)$

　　C. $F\sin\theta$

　　D. $F\cos\theta$
:::

:::problem
<span class="prob-grade">3.【基础题·常考题·选择题】</span><span class="prob-source">（2024 北京通州统考一模，据专题汇编标注；原题选项为公式对象，已转写为文本）</span>如图 1 所示，磁铁将一张厚纸片压在竖直磁性黑板上保持不动。若将这张厚纸片两次折叠后仍能被该磁铁压在黑板上保持不动，如图 2 所示。图 1 中黑板对厚纸片的摩擦力为 $f_1$，最大静摩擦力为 $f_{1\max}$；图 2 中黑板对厚纸片的摩擦力为 $f_2$，最大静摩擦力为 $f_{2\max}$。下列判断正确的是（　）

![左：磁铁把纸片压在竖直磁性黑板上；右：纸片两次折叠后仍被同一磁铁压在黑板上](/blog-images/k016-newton-laws-applications/orig-2024tz-magnet-paper.png)

图 3｜被磁铁压在黑板上的纸片：原样与两次折叠

　　A. $f_1 \gt f_2$

　　B. $f_1 \lt f_2$

　　C. $f_{1\max} \gt f_{2\max}$

　　D. $f_{1\max} \lt f_{2\max}$
:::

:::problem
<span class="prob-grade">4.【基础题·经典题·选择题】</span><span class="prob-source">（2024 北京朝阳统考二模，据专题汇编标注；原题选项为公式对象，已转写为文本）</span>如图所示，光滑水平桌面上木块 A、B 叠放在一起，木块 B 受到一个大小为 F 水平向右的力，A、B 一起向右运动且保持相对静止。已知 A 的质量为 m、B 的质量为 2m，重力加速度为 g。下列说法正确的是（　）

![光滑水平桌面上 A 叠放在 B 上，水平力 F 作用在下面的 B 上，两木块一起向右加速](/blog-images/k016-newton-laws-applications/orig-2024cy2-stacked-blocks.png)

图 4｜叠放并一起加速的 A、B 两木块

　　A. 木块 A 受到两个力的作用

　　B. 木块 B 受到四个力的作用

　　C. 木块 A 所受合力大小为 $\dfrac{F}{3}$

　　D. 木块 B 受到 A 的作用力大小为 $\sqrt{\left( mg \right)^2 + F^2}$
:::

:::problem
<span class="prob-grade">5.【提升题·易错题·选择题】</span><span class="prob-source">（2022 年辽宁卷，据真题汇编标注）</span>如图所示，一小物块从长 1 m 的水平桌面一端以初速度 $v_0$ 沿中线滑向另一端，经过 1 s 从另一端滑落。物块与桌面间动摩擦因数为 $\mu$，$g$ 取 10 m/s²。下列 $v_0$、$\mu$ 值可能正确的是（　）

![小物块以初速度 v₀ 滑过长 1 m 的水平桌面](/blog-images/k016-newton-laws-applications/orig-2021ln-desk.png)

图 5｜滑过桌面的物块

　　A. $v_0 = 2.5$ m/s

　　B. $v_0 = 1.5$ m/s

　　C. $\mu = 0.28$

　　D. $\mu = 0.25$
:::

## B 基础应用（第 6–10 题，必做）

:::problem
<span class="prob-grade">6.【基础题·常考题·选择题】</span><span class="prob-source">（2024 北京门头沟统考一模，据专题汇编标注；原题公式为公式对象，已转写为文本）</span>为研究某鞋的防滑性能，同学将鞋子置于斜面上，逐渐增大斜面倾角 $\theta$。当斜面倾角 $\theta = 37°$ 时鞋子刚好开始滑动。假设滑动摩擦力等于最大静摩擦力，已知 $\sin 37° = 0.6$，$\cos 37° = 0.8$。下列说法正确的是（　）

![鞋子放在可以改变倾角的斜面上，倾角增大到 37° 时刚好滑动](/blog-images/k016-newton-laws-applications/orig-2024mtg-shoe-incline.png)

图 6｜斜面上刚好开始滑动的鞋子

　　A. 鞋子与斜面间的动摩擦因数为 0.8

　　B. 增大斜面倾角 $\theta$，鞋子对斜面的压力减小

　　C. 在鞋子滑动时，增大斜面倾角 $\theta$，鞋子的加速度减小

　　D. 在鞋内放置重物，使鞋子刚好开始滑动时的斜面倾角 $\theta$ 将增大
:::

:::problem
<span class="prob-grade">7.【提升题·经典题·选择题】</span><span class="prob-source">（2024 北京延庆统考一模，据专题汇编标注；原题选项为公式对象，已转写为文本）</span>如图所示，质量均为 m 的 A、B 两物块置于水平地面上，物块与地面间的动摩擦因数均为 μ，物块间用一水平轻绳相连，绳中无拉力。现用水平力 F 向右拉物块 A，假设最大静摩擦力等于滑动摩擦力。重力加速度为 g。下列说法中不正确的是（　）

![质量相同的 A、B 用水平轻绳相连放在地面上，水平力 F 向右拉 A](/blog-images/k016-newton-laws-applications/orig-2024yq-rope-ab.png)

图 7｜水平力拉动绳连的 A、B 两物块

　　A. 当 0＜F≤μmg 时，绳中拉力为 0

　　B. 当 μmg＜F≤2μmg 时，绳中拉力为 F－μmg

　　C. 当 F＞2μmg 时，绳中拉力为 $\dfrac{F}{2}$

　　D. 无论 F 多大，绳中拉力都不可能等于 $\dfrac{F}{3}$
:::

:::problem
<span class="prob-grade">8.【基础题·常考题·计算题】</span><span class="prob-source">（题库《力学计算题集粹》第 25 题；原扫描图过小，按配图说明自绘）</span>如图所示，质量为 1 kg 的小物块以 5 m/s 的初速度滑上一块原来静止在水平面上的木板，木板的质量为 4 kg。经过时间 2 s 以后，物块从木板的另一端以 1 m/s 相对地的速度滑出，在这一过程中木板的位移为 0.5 m，求木板与水平面间的动摩擦因数。（g 取 10 m/s²）

![小物块以初速度 v0 从左端滑上静止在水平地面上的木板](/blog-images/k016-newton-laws-applications/fig-q25-slide-onto-board.png)

图 8｜滑上静止木板的小物块
:::

:::problem
<span class="prob-grade">9.【提升题·易错题·选择题】</span><span class="prob-source">（2024 北京西城统考二模，据专题汇编标注；原题选项为公式对象，已转写为文本）</span>列车沿平直的道路做匀变速直线运动，在车厢顶部用细线悬挂一个小球，小球相对车厢静止时，细线与竖直方向的夹角为 θ。下列说法正确的是（　）

![加速行驶的车厢内，悬挂的小球的细线偏离竖直方向 θ 角](/blog-images/k016-newton-laws-applications/orig-2024xc2-train-pendulum.png)

图 9｜车厢内偏离竖直方向的悬挂小球

　　A. 列车加速度的大小为 $g\tan\theta$

　　B. 列车加速度的大小为 $g\sin\theta$

　　C. 细线拉力的大小为 $mg\sin\theta$

　　D. 细线拉力的大小为 $mg\cos\theta$
:::

:::problem
<span class="prob-grade">10.【基础题·经典题·选择题（多选）】</span><span class="prob-source">（题库《力学选择题集粹》第 26 题）</span>如图所示，水平地面上有两块完全相同的木块 A、B，在水平推力 F 作用下运动。用 $F_{AB}$ 代表 A、B 间的相互作用力。（　）

![水平推力 F 推着并排的 A、B 两木块前进](/blog-images/k016-newton-laws-applications/fig-q26-ab-push.png)

图 9｜并排前进的 A、B 两木块

　　A. 若地面是完全光滑的，则 $F_{AB} = F$

　　B. 若地面是完全光滑的，则 $F_{AB} = F/2$

　　C. 若地面是有摩擦的，则 $F_{AB} = F$

　　D. 若地面是有摩擦的，则 $F_{AB} = F/2$
:::

## C 提升与综合（第 11–15 题，第 11–14 题推荐完成，第 15 题选做）

:::problem
<span class="prob-grade">11.【提升题·易错题·选择题（多选）】</span><span class="prob-source">（题库《力学选择题集粹》第 22 题）</span>如图所示，在一无限长的小车上，有质量分别为 $m_1$ 和 $m_2$ 的两个滑块（$m_1 > m_2$）随车一起向右匀速运动，设两滑块与小车间的动摩擦因数均为 $\mu$，其它阻力不计，当车突然停止时，以下说法正确的是（　）

![小车载着两个滑块向右匀速运动，车突然停止](/blog-images/k016-newton-laws-applications/fig-q22-cart-blocks.png)

图 10｜小车上一起匀速运动的两滑块

　　A. 若 $\mu = 0$，两滑块一定相碰

　　B. 若 $\mu = 0$，两滑块一定不相碰

　　C. 若 $\mu \neq 0$，两滑块一定相碰

　　D. 若 $\mu \neq 0$，两滑块一定不相碰
:::

:::problem
<span class="prob-grade">12.【提升题·经典题·计算题】</span><span class="prob-source">（2023 年全国卷，据真题汇编标注）</span>一列火车以速度 $v_0$ 沿水平长直轨道匀速行驶，突然列车后部有部分车厢脱钩。已知脱钩后车头的牵引力不变；脱钩车厢的质量为列车总质量的 $\frac{1}{4}$；假设列车所受阻力与其所受重力成正比。求当脱钩车厢的速度变为 $\frac{v_0}{2}$ 时，列车前部未脱钩部分的速度。

![匀速行驶的列车后部脱钩：前部牵引力不变，脱钩车厢开始减速](/blog-images/k016-newton-laws-applications/fig-q34-train-decouple.png)

图 11｜脱钩瞬间的前部车厢与脱钩车厢
:::

:::problem
<span class="prob-grade">13.【提升题·常考题·选择题（多选）】</span><span class="prob-source">（题库《力学选择题集粹》第 130 题）</span>如图所示，质量为 $m_2$ 的物体 2 放在车厢的水平底板上，用竖直细绳通过光滑定滑轮与质量为 $m_1$ 的物体 1 相连。车厢正沿水平直轨道向右行驶，此时与物体 1 相连的细绳与竖直方向成 $\theta$ 角，由此可知（　）

![向右加速的车厢内，物体 1 悬挂偏离竖直方向 θ 角，绳另一侧竖直连着底板上的物体 2](/blog-images/k016-newton-laws-applications/fig-q130-car-pendulum.png)

图 12｜加速车厢内的连接体

　　A. 车厢的加速度大小为 $g\sin\theta$

　　B. 绳对 $m_1$ 的拉力大小为 $\dfrac{m_1 g}{\cos\theta}$

　　C. 底板对物体 2 的支持力大小为 $(m_2 - m_1)g$

　　D. 底板对 $m_2$ 的摩擦力大小为 $m_2 g\tan\theta$
:::

:::problem
<span class="prob-grade">14.【提升题·经典题·计算题】</span><span class="prob-source">（题库《力学计算题集粹》第 29 题；原扫描图过小，按配图说明自绘）</span>如图所示，一质量为 m 的滑块能在倾角为 θ 的斜面上以 $a = \dfrac{g\sin\theta}{2}$ 匀加速下滑。若用一水平推力 F 作用于滑块，使之能静止在斜面上，求推力 F 的大小。

![滑块在倾角 θ 的斜面上，水平推力 F 水平推入斜面方向作用于滑块](/blog-images/k016-newton-laws-applications/fig-q29-incline-push.png)

图 13｜先匀加速下滑、后被水平推力按停在斜面上的滑块
:::

:::problem
<span class="prob-grade">15.【提升题·经典题·选择题】</span><span class="prob-source">（2022 年全国乙卷，据真题汇编标注）</span>如图，一不可伸长轻绳两端各连接一质量为 $m$ 的小球，初始时整个系统静置于光滑水平桌面上，两球间的距离等于绳长 L。一大小为 F 的水平恒力作用在轻绳的中点，方向与两球连线垂直。当两球运动至二者相距 $\frac{3}{5}L$ 时，它们加速度的大小均为（　）

![俯视图：轻绳两端各连一个小球，恒力 F 作用在绳中点，两球相距 3L/5](/blog-images/k016-newton-laws-applications/fig-q8-rope-midpoint.png)

图 14｜绳中点施力的俯视示意（按比例绘制）

　　A. $\dfrac{5F}{8m}$

　　B. $\dfrac{2F}{5m}$

　　C. $\dfrac{3F}{8m}$

　　D. $\dfrac{3F}{10m}$
:::

## 自测对照表

:::selfcheck

对答案前先看一眼表 1：哪一层错，就回哪一层。

表 1｜自测对照：检测目标与回查位置

| 题号 | 检测目标 | 对应讲解位置 | 典型错误类型 |
| --- | --- | --- | --- |
| 1–3 | 力与运动方向的对应、用平衡与合力判断状态 | 主讲篇第二、四节；方法篇第二节 | 把速度方向当合力方向；漏画重力 |
| 4、10 | 连接体内力与整体法的关系 | 主讲篇第六节；方法篇第五节 | 整体方程塞内力；摩擦算进内力 |
| 5 | 由运动范围反推受力条件 | 方法篇第二节 | 末速度忘设"大于零"；不等式方向反 |
| 6 | 斜面临界与正交分解 | 主讲篇第五节；方法篇第三节 | 临界条件写成 $\mu = \sin\theta$；压力忘用 $\cos\theta$ |
| 7、9 | 已知临界量或装置读数反求 $a$ | 方法篇第二节 | 临界对象选错；刻度当成位移而不是形变 |
| 8、12 | 两阶段计算与衔接 | 方法篇第一节、第四节 | 撤力后沿用旧加速度；阻力比例没先设系数 |
| 11、13 | 分阶段与多物体的组合判断 | 方法篇第四、五节 | 共速后沿用旧加速度；两侧加速度方向不分 |
| 14、15 | 综合计算与几何约束 | 方法篇第一、三节；主讲篇第三节 | 单位换算漏做；绳中点受力漏对称条件 |

:::

## 本单元答案区（按题号逐题）

1. B。

依据：书不滑动，说明书与列车一起加速，书靠静摩擦力提供加速度。静摩擦最大为：

:::formula
f_{\text{max}} = \mu mg = 0.4 \times m \times 10\ \text{m/s}^2 = 4m\ \text{N}
:::

由 $f = ma$，书（也就是列车）能达到的最大加速度 $a_{\text{max}} = 4$ m/s²，再大书就滑出去了。

　　A 错。2.0 m/s² 对应 $\mu = 0.2$，与题给 0.4 不符。
　　C 错。6.0 m/s² 需要 $\mu = 0.6$。
　　D 错。8.0 m/s² 需要 $\mu = 0.8$。

检查：这类题的检验方式是"临界时摩擦力恰好达到最大"，把 $a = \mu g$ 的来龙去脉写一遍，别当口诀背。

2. D。

依据：物体静止，合力为零。水平方向只有拉力的水平分量与静摩擦力：

:::formula
f = F\cos\theta
:::

方向与 $F\cos\theta$ 相反。

　　A 错、B 错。$\mu mg$ 与 $\mu N$ 都是"滑动（或最大静）摩擦"的算法——物体没滑动，摩擦力是被动力，按平衡需求取值，与 $\mu$ 无关；而且 B 项连正压力都写错了（$N = mg - F\sin\theta$）。

　　C 错。$F\sin\theta$ 是竖直分量，由地面支持力的变化去平衡，不参与水平方向的平衡。

检查：见到"静止"先写合力为零，摩擦力要多少给多少；$\mu$ 只在判断"会不会滑"时才出场。

3. C。

依据：两种情形下纸片都静止，黑板对纸片的摩擦力都等于它需要扛住的重力——纸片与磁铁的重力没有变，所以 $f_1 = f_2$，A、B 错。折叠后纸片变厚，磁铁与黑板间的距离增大，磁性吸引力减小，磁铁对纸片的压力与黑板对纸片的弹力都随之减小，最大静摩擦力减小：

:::formula
f_{1\max} \gt f_{2\max}
:::

　　A 错、B 错。摩擦力由平衡决定，两种情形承载的重力相同。

　　D 错。距离增大 → 吸引力减小 → 弹力减小 → 最大静摩擦只会变小。

检查：把"摩擦力"与"最大静摩擦力"分开——前者由平衡定，后者由正压力定；折叠改变的是压力这一头，不是重力那一头。

4. C。

依据：A、B 一起加速，先整体：

:::formula
a = \frac{F}{m + 2m} = \frac{F}{3m}
:::

A 在水平方向只受 B 给它的摩擦力，由 $F = ma$，A 所受合力：

:::formula
F_{\text{合}} = ma = \frac{F}{3}
:::

　　A 错。A 受重力、支持力、摩擦力三个力——没有摩擦它就无法加速。

　　B 错。B 受重力、地面支持力、A 的压力、A 的摩擦力、拉力 F，共五个力。

　　D 错。A 对 B 有竖直向下的压力 $mg$ 与水平向左的摩擦力 $\frac{F}{3}$，合作用力为 $\sqrt{\left( mg \right)^2 + \left( \frac{F}{3} \right)^2}$，不是 $\sqrt{\left( mg \right)^2 + F^2}$。

检查：数受力时先定对象、再逐个找施力物体；"叠放体之间的作用力"要把压力与摩擦力按矢量合成，两条互相垂直的力不能直接相加。

5. B。

依据：物块一直减速但滑到另一端时还没停，所以末速度 $v > 0$。匀减速的平均速度满足：

:::formula
\frac{v_0 + v}{2} = \frac{x}{t} = \frac{1\ \text{m}}{1\ \text{s}} = 1\ \text{m/s}
:::

所以 $v = 2 - v_0$，要 $v > 0$ 必须有 $v_0 < 2$ m/s，B 可能、A 不可能。再由：

:::formula
v_0^2 - v^2 = 2\mu g x
:::

:::formula
\mu = \frac{v_0^2 - (2 - v_0)^2}{20} = \frac{4v_0 - 4}{20}
:::

把 $v_0 < 2$ m/s 代入得 $\mu < 0.2$，C、D 都太大。

　　A 错。$v_0 = 2.5$ m/s 时平均速度已超过 1 m/s，物块不到 1 s 就滑出桌面。
　　C 错、D 错。$\mu$ 不小于 0.2 时物块会在桌面上停住。

检查：这道题的钥匙是隐含条件"滑落时还有速度"。凡是"可能值"题，先把范围解出来再对选项。

6. B。

依据：刚好滑动时摩擦力达到最大且沿斜面平衡重力分量：$mg\sin\theta = \mu mg\cos\theta$，所以 $\mu = \tan 37° = \dfrac{0.6}{0.8} = 0.75$。滑动后倾角增大，支持力 $N = mg\cos\theta$ 随 $\cos\theta$ 减小而减小，鞋子对斜面的压力随之减小。

　　A 错。$\mu = 0.75$，不是 0.8。
　　C 错。滑动时 $a = g(\sin\theta - \mu\cos\theta)$，$\theta$ 增大时 $\sin\theta$ 增大、$\cos\theta$ 减小，加速度增大。
　　D 错。滑动条件 $\tan\theta > \mu$ 与质量无关，放重物 $\theta$ 不变。

检查：临界角的两套说法要互通：$\tan\theta = \mu$ 等价于"重力分量恰好压过最大静摩擦"。

7. D（选不正确的）。

依据：分三段讨论绳的拉力。当 $0 \lt F \leq \mu mg$，A 自己的静摩擦就足以平衡 F，绳中无拉力，A 对。当 $\mu mg \lt F \leq 2\mu mg$，A 的静摩擦已顶到最大值 $\mu mg$，多出的力经绳传给 B，整体仍静止：

:::formula
T = F - \mu mg
:::

B 对。当 $F \gt 2\mu mg$，整体加速：

:::formula
a = \frac{F - 2\mu mg}{2m}
:::

对 B 用隔离，$T - \mu mg = ma$，解得：

:::formula
T = \frac{F}{2}
:::

C 对。而绳中拉力是随 F 连续增大的：静止段 $T = F - \mu mg$ 取遍 $\left( 0, \mu mg \right]$，取 $F = \frac{4}{3}\mu mg$ 时恰有 $T = \frac{F}{3}$——"不可能等于 $\frac{F}{3}$"说法错误，D 即所求。

检查：绳是被动的传力件，张力由两端的"需求"决定；两个门槛 $\mu mg$（B 开始被拉）与 $2\mu mg$（整体开始滑动）把问题切成三段，逐段写平衡或牛顿第二定律即可。

8. 答案：μ＝0.02。

依据：物块在木板上匀减速，由运动学：

:::formula
a_1 = \frac{v_0 - v}{t} = \frac{5 \text{ m/s} - 1 \text{ m/s}}{2 \text{ s}} = 2 \text{ m/s}^2
:::

木板给物块的滑动摩擦力：

:::formula
f_1 = ma_1 = 1 \text{ kg} \times 2 \text{ m/s}^2 = 2 \text{ N}
:::

物块给木板等大的反作用力 $f_1' = 2$ N（向右）。木板由静止匀加速，由 $s = \frac{1}{2}a_2t^2$：

:::formula
a_2 = \frac{2s}{t^2} = \frac{2 \times 0.5 \text{ m}}{\left( 2 \text{ s} \right)^2} = 0.25 \text{ m/s}^2
:::

对木板，水平方向受物块的摩擦力 $f_1'$ 与地面的摩擦力 $f_2$：

:::formula
f_1' - f_2 = Ma_2 \quad \Rightarrow \quad f_2 = 2 \text{ N} - 4 \text{ kg} \times 0.25 \text{ m/s}^2 = 1 \text{ N}
:::

地面对木板的正压力是"板加物"的全部重量：

:::formula
\mu = \frac{f_2}{\left( M + m \right)g} = \frac{1 \text{ N}}{5 \text{ kg} \times 10 \text{ m/s}^2} = 0.02
:::

检查：两个物体各自"运动学求 $a$、牛顿定律求力"，在彼此的摩擦力这一处对接；地面摩擦扛的是板与物块的总重，只算木板重量是本题最常见错误。

9. A。

依据：小球受重力与绳的拉力，合力水平指向加速度方向。竖直方向平衡、水平方向牛顿第二定律：

:::formula
T\cos\theta = mg, \qquad T\sin\theta = ma
:::

两式相除：

:::formula
a = g\tan\theta
:::

代回第一式：

:::formula
T = \frac{mg}{\cos\theta}
:::

　　B 错。把三角函数用错，水平合力对应 $\tan\theta$。

　　C 错、D 错。拉力比重力大（$\cos\theta \lt 1$），$mg\sin\theta$ 与 $mg\cos\theta$ 都小于应有的值。

检查：摆球问题记两条——"水平除以竖直得 $a$"与"竖直分量得 $T$"；画出重力、拉力与合力的直角三角形，两个结论都是它的边角关系。

10. BD（多选）。

依据：两块完全相同，质量都是 $m$。光滑时整体加速度 $a = \dfrac{F}{2m}$，隔离 B：

:::formula
F_{AB} = ma = \frac{F}{2}
:::

粗糙、动摩擦因数相同时，整体 $a = \dfrac{F - 2\mu mg}{2m}$，隔离 B：

:::formula
F_{AB} - \mu mg = ma = \frac{F}{2} - \mu mg
:::

:::formula
F_{AB} = \frac{F}{2}
:::

两种情况 $F_{AB}$ 都等于 $F/2$。

　　A 错、C 错。把"推力"误当成"B 受到的力"。

检查：摩擦力虽然改变了加速度，却在隔离方程两边同消——这个"与地面粗糙程度无关"的结论可以直接用来验算。

11. BD（多选）。

依据：车突然停止的瞬间，两滑块都因惯性以原来的速度向右运动。若 $\mu = 0$，它们都以这个速度匀速前进，距离永远不变，一定不相碰；若 $\mu \neq 0$，两滑块质量不同但摩擦因数相同，减速的加速度都是 $\mu g$，速度在任何时刻都相同，同样不相碰。

　　A 错。$\mu = 0$ 时没有力改变两滑块的速度。
　　C 错。加速度相同、初速度相同，运动步调一致。

检查：判断"碰不碰"只看两个滑块的速度差随时间怎么变，与车的质量、滑块质量都无关。

12. 答案：$\dfrac{7}{6}v_0$。

依据：设列车总质量为 $M$，阻力与重力成比例的系数为 $k$。匀速行驶时牵引力：

:::formula
F = kMg
:::

脱钩车厢（质量 $\frac{M}{4}$）只受阻力，减速的加速度大小：

:::formula
a_1 = \frac{k \cdot \frac{M}{4} g}{\frac{M}{4}} = kg
:::

前部（质量 $\frac{3M}{4}$）牵引力不变、阻力变小，加速的加速度：

:::formula
a_2 = \frac{kMg - k \cdot \frac{3M}{4} g}{\frac{3M}{4}} = \frac{1}{3}kg
:::

脱钩车厢速度减到 $\frac{v_0}{2}$ 所用时间：

:::formula
t = \frac{v_0 - \frac{v_0}{2}}{kg} = \frac{v_0}{2kg}
:::

:::formula
v = v_0 + a_2 t = v_0 + \frac{1}{3}kg \times \frac{v_0}{2kg} = \frac{7}{6}v_0
:::

检查：设比例系数 $k$ 是这类"阻力与重力成正比"题的第一步，别直接拿 $g$ 当减速度。两段运动时间相同，是衔接的桥梁。

13. BD（多选）。

依据：物体 1 相对车厢静止，受重力与绳的拉力，合力水平向右。竖直方向：

:::formula
T\cos\theta = m_1 g
:::

水平方向：

:::formula
T\sin\theta = m_1 a
:::

两式相除得 $a = g\tan\theta$（A 错），拉力 $T = \dfrac{m_1 g}{\cos\theta}$（B 对）。物体 2 与车厢一起加速，水平方向只靠摩擦力：

:::formula
f = m_2 a = m_2 g\tan\theta
:::

D 对。竖直方向 $N + T = m_2 g$（绳竖直向上拉物体 2），所以 $N = m_2 g - \dfrac{m_1 g}{\cos\theta}$，小于 $(m_2 - m_1)g$，C 错。

　　A 错。把 $\tan\theta$ 写成了 $\sin\theta$。
　　C 错。绳对物体 2 的拉力是 $\dfrac{m_1 g}{\cos\theta}$，不是 $m_1 g$。

检查：悬挂物偏离方向是"已知运动求力"的典型信号——先按竖直、水平分解，$a$ 和 $T$ 一次到位。

14. 答案：当摩擦力沿斜面向上时 $F = \dfrac{mg\sin\theta\cos\theta}{2\cos^2\theta + \sin^2\theta}$；若滑块被推得有上滑趋势、摩擦力沿斜面向下，则 $F = \dfrac{3mg\sin\theta\cos\theta}{2\cos^2\theta - \sin^2\theta}$。

依据：先由匀加速下滑求动摩擦因数：

:::formula
mg\sin\theta - \mu mg\cos\theta = m \cdot \frac{g\sin\theta}{2} \quad \Rightarrow \quad \mu = \frac{\tan\theta}{2}
:::

加水平推力 F 后滑块静止，按摩擦力的方向分两种情形。

情形一，摩擦力沿斜面向上（推力较小时，滑块仍有下滑趋势）：沿斜面与垂直斜面分解，$F\cos\theta + f = mg\sin\theta$，$N = mg\cos\theta + F\sin\theta$，$f = \mu N$：

:::formula
F\left( \cos\theta - \mu\sin\theta \right) = mg\left( \sin\theta - \mu\cos\theta \right)
:::

代入 $\mu = \dfrac{\tan\theta}{2}$，整理得：

:::formula
F = \frac{mg\sin\theta\cos\theta}{2\cos^2\theta + \sin^2\theta}
:::

情形二，摩擦力沿斜面向下（推力较大时，滑块有上滑趋势）：$F\cos\theta = mg\sin\theta + f$，同样代入 $\mu$：

:::formula
F = \frac{mg\left( \sin\theta + \mu\cos\theta \right)}{\cos\theta - \mu\sin\theta} = \frac{3mg\sin\theta\cos\theta}{2\cos^2\theta - \sin^2\theta}
:::

检查：水平推力有两个分量要同时进方程——沿斜面的 $F\cos\theta$ 与"加大正压力"的 $F\sin\theta$，漏掉后者是最常见的错；"静止"不指定摩擦方向时，上滑、下滑两种趋势各解一遍，两个 F 都是真解。

15. A。

依据：两球相距 $\frac{3}{5}L$ 时，绳的两个半段与力 F 的方向成 $\theta$ 角，按几何关系（绳总长 $L$，半段长 $\frac{L}{2}$；半段在连线方向上的投影是 $\frac{3}{10}L$）：

:::formula
\sin\theta = \frac{\frac{3}{10}L}{\frac{L}{2}} = \frac{3}{5},\qquad \cos\theta = \frac{4}{5}
:::

绳的中点沿 F 方向只受三个力，由对称性两段绳张力相等，沿 F 方向平衡：

:::formula
2T\cos\theta = F,\qquad T = \frac{F}{2 \times \frac{4}{5}} = \frac{5F}{8}
:::

每只小球沿绳方向只受张力，加速度大小：

:::formula
a = \frac{T}{m} = \frac{5F}{8m}
:::

　　B 错、C 错、D 错。都来自对绳中点受力或几何关系的不同错法：漏掉"两段绳对称、竖直方向抵消"或把 $\sin\theta$ 与 $\cos\theta$ 用反。

检查：绳节点问题先画节点受力，"两段对称"让垂直 F 方向自动平衡，只剩沿 F 方向的一条方程。

## 配套文章导航

- 概念与框架回主讲篇[《牛顿运动定律的应用①》](/blog/k016-newton-laws-applications-concepts/)：两类基本问题、斜面两式与连接体规矩都在那里。
- 五类题型的固定路径见[《牛顿运动定律的应用②》](/blog/k016-newton-laws-applications-methods/)：第 1、8 题对应第一节，第 2、5、9、13 题对应第二节，第 6、14 题对应第三节，第 11 题对应第四节，第 4、10 题对应第五节，第 3、7、12、15 题是跨类综合。
