import { NextResponse } from "next/server";
import { csrErrorResponse } from "@/lib/csr/http";
import { withApi } from "@/lib/http/with-api";
import { vehicleMakes, vehicleModels } from "@/lib/vehicles/catalog";
import { matchVehicleNames } from "@/lib/vehicles/names";

const cacheControl = "private, max-age=604800";

export const GET = withApi(async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const query = url.searchParams.get("q") ?? "";
    if (type === "makes") {
      if (query.trim().length < 2) return NextResponse.json({ options: [] }, { headers: { "Cache-Control": cacheControl } });
      const options = matchVehicleNames(await vehicleMakes(), query);
      return NextResponse.json({ options }, { headers: { "Cache-Control": cacheControl } });
    }
    if (type === "models") {
      const make = (url.searchParams.get("make") ?? "").trim();
      if (make.length < 2) return NextResponse.json({ options: [] }, { headers: { "Cache-Control": cacheControl } });
      const year = (url.searchParams.get("year") ?? "").trim();
      const all = await vehicleModels(make, year);
      const options = query.trim().length === 0 ? all.slice(0, 200) : matchVehicleNames(all, query);
      return NextResponse.json({ options }, { headers: { "Cache-Control": cacheControl } });
    }
    return NextResponse.json({ error: "That catalog was not found" }, { status: 400 });
  } catch (error) {
    return csrErrorResponse(error);
  }
}, { auth: "required", limit: "standard" });
