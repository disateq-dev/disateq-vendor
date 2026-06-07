import { generarCodigo } from "./pedido.service";
import type { Pedido, EventoPedido } from "./pedido.types";
import { pedidoStore } from "./pedido.store";

interface DivisionResult {
  pedidoOriginal: Pedido;
  pedidoNuevo: Pedido;
}

function crearEvento(
  pedidoId: string,
  tipo: EventoPedido["tipo"],
  operadorId: string,
  detalle: string | null
): EventoPedido {
  return {
    id: crypto.randomUUID(),
    pedidoId,
    tipo,
    momento: new Date().toISOString(),
    operadorId,
    detalle,
  };
}

export const pedidoOperations = {

  concretarPedido(pedidoId: string, operadorId: string): Pedido {
    const pedido = pedidoStore.getPedidoById(pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (pedido.estado !== "EN_COBRO")
      throw new Error("Solo se puede concretar un pedido en cobro");
    const lineasActivas = pedido.lineas.filter(l => l.estado === "ACTIVA");
    if (lineasActivas.length === 0)
      throw new Error("El pedido no tiene líneas activas");

    pedido.estado = "CONCRETADO";
    pedido.momentoConcrecion = new Date().toISOString();
    pedido.eventos.push(
      crearEvento(pedidoId, "PEDIDO_CONCRETADO", operadorId, null)
    );
    return pedidoStore.guardarPedido(pedido);
  },

  dividirPedido(
    pedidoId: string,
    lineaIds: string[],
    operadorId: string
  ): DivisionResult {
    const pedido = pedidoStore.getPedidoById(pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (pedido.estado !== "ABIERTO")
      throw new Error("Solo se puede dividir un pedido abierto");
    if (lineaIds.length === 0)
      throw new Error("Debe seleccionar al menos una línea para dividir");

    const todasExisten = lineaIds.every(id =>
      pedido.lineas.some(l => l.id === id)
    );
    if (!todasExisten)
      throw new Error("Una o más líneas no pertenecen a este pedido");

    const lineasActivasOriginales = pedido.lineas.filter(
      l => l.estado === "ACTIVA"
    );
    const lineasActivasQueQuedan = lineasActivasOriginales.filter(
      l => !lineaIds.includes(l.id)
    );
    if (lineasActivasQueQuedan.length === 0)
      throw new Error(
        "El pedido original debe conservar al menos una línea activa"
      );

    const codigoNuevo = generarCodigo();
    const idNuevo = crypto.randomUUID();

    const lineasAMover = pedido.lineas
      .filter(l => lineaIds.includes(l.id))
      .map(l => ({
        ...l,
        id: crypto.randomUUID(),
        pedidoId: idNuevo,
      }));

    const pedidoNuevo: Pedido = {
      id: idNuevo,
      codigo: codigoNuevo,
      estado: "ABIERTO",
      contextoOperacionalId: pedido.contextoOperacionalId,
      identidadOperacionalId: pedido.identidadOperacionalId,
      operadorId,
      lineas: lineasAMover,
      eventos: [
        crearEvento(
          idNuevo,
          "PEDIDO_DIVIDIDO",
          operadorId,
          `Dividido desde ${pedido.codigo}`
        ),
      ],
      momentoApertura: new Date().toISOString(),
      momentoConcrecion: null,
      momentoAbandono: null,
      motivoAbandono: null,
    };

    pedido.lineas = pedido.lineas.filter(l => !lineaIds.includes(l.id));
    pedido.eventos.push(
      crearEvento(
        pedidoId,
        "PEDIDO_DIVIDIDO",
        operadorId,
        `División hacia ${codigoNuevo}`
      )
    );

    pedidoStore.guardarPedido(pedido);
    pedidoStore.guardarPedido(pedidoNuevo);

    return { pedidoOriginal: pedido, pedidoNuevo };
  },

  fusionarPedidos(
    pedidoBaseId: string,
    pedidoAbsorbidoId: string,
    operadorId: string
  ): Pedido {
    const pedidoBase = pedidoStore.getPedidoById(pedidoBaseId);
    if (!pedidoBase) throw new Error("Pedido base no encontrado");

    const pedidoAbsorbido = pedidoStore.getPedidoById(pedidoAbsorbidoId);
    if (!pedidoAbsorbido) throw new Error("Pedido a fusionar no encontrado");

    if (pedidoBase.estado !== "ABIERTO")
      throw new Error("El pedido base debe estar abierto");
    if (pedidoAbsorbido.estado !== "ABIERTO")
      throw new Error("El pedido a fusionar debe estar abierto");
    if (pedidoBaseId === pedidoAbsorbidoId)
      throw new Error("No se puede fusionar un pedido consigo mismo");
    if (
      pedidoBase.contextoOperacionalId !==
      pedidoAbsorbido.contextoOperacionalId
    )
      throw new Error(
        "Solo se pueden fusionar pedidos del mismo contexto operacional"
      );

    const lineasAbsorbidas = pedidoAbsorbido.lineas.map(l => ({
      ...l,
      id: crypto.randomUUID(),
      pedidoId: pedidoBaseId,
    }));

    pedidoBase.lineas.push(...lineasAbsorbidas);
    pedidoBase.eventos.push(
      crearEvento(
        pedidoBaseId,
        "PEDIDO_FUSIONADO",
        operadorId,
        `Fusionado desde ${pedidoAbsorbido.codigo}`
      )
    );

    pedidoAbsorbido.estado = "ABANDONADO";
    pedidoAbsorbido.momentoAbandono = new Date().toISOString();
    pedidoAbsorbido.motivoAbandono =
      `Fusionado en ${pedidoBase.codigo}`;
    pedidoAbsorbido.eventos.push(
      crearEvento(
        pedidoAbsorbidoId,
        "PEDIDO_FUSIONADO",
        operadorId,
        `Fusionado en ${pedidoBase.codigo}`
      )
    );

    pedidoStore.guardarPedido(pedidoBase);
    pedidoStore.guardarPedido(pedidoAbsorbido);

    return pedidoBase;
  },

};
