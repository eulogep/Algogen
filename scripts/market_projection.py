from pathlib import Path
import matplotlib.pyplot as plt

# Source: MarketsandMarkets, AI for Customer Service Market (base 2024 = 12.06 B$, CAGR 2024-2030 = 25.8%).
base_year = 2024
base_value = 12.06
cagr = 0.258
years = list(range(2024, 2031))
values = [base_value * ((1 + cagr) ** (year - base_year)) for year in years]

plt.style.use("default")
fig, ax = plt.subplots(figsize=(10, 5.6), dpi=180)
fig.patch.set_facecolor("#ffffff")
ax.set_facecolor("#ffffff")

ax.plot(years, values, color="#148A62", linewidth=3, marker="o", markersize=6)
ax.fill_between(years, values, color="#CBEBDD", alpha=0.65)
ax.scatter([2024, 2030], [values[0], values[-1]], color="#0C5C43", s=45, zorder=5)

for x, y in [(2024, values[0]), (2026, values[2]), (2030, values[-1])]:
    ax.annotate(f"{y:.1f} Md$", (x, y), xytext=(0, 12), textcoords="offset points",
                ha="center", fontsize=10, fontweight="bold", color="#12352A")

ax.set_title("Marché mondial de l’IA pour le service client — projection", loc="left",
             fontsize=16, fontweight="bold", color="#15221E", pad=16)
ax.text(0, 1.02, "Projection dérivée d’une base de 12,06 Md$ en 2024 et d’un CAGR de 25,8 % jusqu’en 2030.",
        transform=ax.transAxes, fontsize=9.5, color="#4E5F58")
ax.set_ylabel("Milliards USD")
ax.set_xticks(years)
ax.set_ylim(0, max(values) * 1.2)
ax.grid(axis="y", color="#DCE6E1", linewidth=0.8)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_color("#A5B5AE")
ax.spines["bottom"].set_color("#A5B5AE")
ax.tick_params(colors="#4E5F58")
ax.text(0, -0.22, "Source : MarketsandMarkets, AI for Customer Service Market. Les années intermédiaires sont un calcul à CAGR constant ;\nla valeur 2030 dérivée est cohérente, à l’arrondi près, avec la prévision publiée de 47,82 Md$.",
        transform=ax.transAxes, fontsize=8.5, color="#4E5F58", va="top")

output = Path("/home/ubuntu/Algogen/market_ai_customer_service.png")
fig.tight_layout()
fig.savefig(output, bbox_inches="tight", facecolor=fig.get_facecolor())
print(output)
