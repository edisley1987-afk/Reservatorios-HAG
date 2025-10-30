async function atualizarReservatorios() {
  try {
    const response = await fetch("/api/readings");
    const data = await response.json();

    // Atualiza cada reservatório na tela
    data.forEach((item) => {
      const nome = item.sensor.toLowerCase().replace(" ", "");
      const porcentagem = item.porcentagem || 0;
      const litros = item.litros || 0;
      const hora = item.hora || "N/A";

      document.getElementById(`nivel-${nome}`).style.width = `${porcentagem}%`;
      document.getElementById(`valor-${nome}`).innerText = `${porcentagem.toFixed(1)}% (${litros} L)`;
      document.getElementById(`hora-${nome}`).innerText = hora;
    });

  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
  }
}

// Atualiza automaticamente a cada 30 segundos
setInterval(atualizarReservatorios, 30000);

// Atualiza também assim que a página carregar
window.onload = atualizarReservatorios;
