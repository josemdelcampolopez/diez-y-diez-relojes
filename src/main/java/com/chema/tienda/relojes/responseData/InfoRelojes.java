package com.chema.tienda.relojes.responseData;

import java.util.List;
import java.util.Map;

//Tipo de dato para devolver los relojes de una página y
//el total de resultados al js mostrarRelojes
public class InfoRelojes {

    private List<Map<String, Object>> relojes;
    private int totalRelojes;

    public List<Map<String, Object>> getRelojes() {
        return relojes;
    }

    public void setRelojes(List<Map<String, Object>> relojes) {
        this.relojes = relojes;
    }

    public int getTotalRelojes() {
        return totalRelojes;
    }

    public void setTotalRelojes(int totalRelojes) {
        this.totalRelojes = totalRelojes;
    }
}
