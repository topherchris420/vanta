# Sum First

Open **Try Sum First** in the [Research atlas](https://mitpress.vercel.app/research), or visit
[Sum First](https://mitpress.vercel.app/research/sum-first). The atlas is the destination of
the Event Horizon Archive on Vanta's home page.

The experiment reproduces one mode-sum calculation from
[Venkatesa Chandrasekaran, arXiv:2611.34924v1, §4.4](https://arxiv.org/html/2611.34924v1#S4.SS4),
equations (4.33) and (4.34). It is not a simulation of gravity or validation
of the preprint's broader claims.

- **Sum first.** At finite cutoff N, the paper's amplitude is
  A_N = (1 / (2s²)) Σ exp(−2ik/s) / k². The chart shows
  −s³ Im(A_N) = (s / 2) Σ sin(2k/s) / k², not its magnitude.
- **Expand first.** Replacing sin(2k/s) by 2k/s at each fixed mode gives H_N = Σ 1/k
  on the same displayed scale. The first-order expansion is not uniform in k
  as the cutoff grows for fixed s.
- **Guide.** Mode s/2 marks where the argument of the sine reaches one radian,
  not a phase transition or an exact boundary of accuracy.

At s = 16 and N = 4, the two displayed values are 2.057494 and 2.083333.
At the same s and N = 1024, they are 3.079703 and 7.509176.

Run `node --test tests/sumFirst.test.js` to check these points and two
independent controls. The sine remainder bounds the difference by
N(N + 1)/(3s²). At s = 4/π, separating even and odd terms of the infinite
series gives 2s² A = −π²/48 − iG, where G is Catalan's constant.
The complex tail for 2s² A_N is bounded by 1/N using Σ_{k>N} 1/k² ≤ 1/N.
