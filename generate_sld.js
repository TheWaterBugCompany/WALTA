#!/usr/bin/env node
const WktUtils = require("./walta-app/app/lib/util/WktUtils")

function makeSymbolizer( angle, color ) {
    return `                    <Graphic>
                        <Mark>
                            <WellKnownName>wkt://${WktUtils.makeArc(0,45,1)}</WellKnownName>
                            <Fill>
                                <CssParameter name="fill">${color}</CssParameter>
                            </Fill>
                        </Mark>
                        <Size>10</Size>
                        <Rotation>${angle}</Rotation>
                    </Graphic>` ;
}

const MAYFLY_LEGEND = [
    { name: "Siphlonuridae", ref: "adult_siphlonuridae", code: "QE01*", color: "#e3b505", symbolizer: makeSymbolizer( 0, "#e3b505" ) },
    { name: "Baetidae", ref: "adult_baetidae", code: "QE02*", color: "#95190c", symbolizer: makeSymbolizer( 45, "#95190c" ) },
    { name: "Oniscigastridae", ref: "adult_oniscigastridae", code: "QE03*", color: "#610345", symbolizer: makeSymbolizer( 90, "#610345" ) },
    { name: "Ameletopsidae", ref: "adult_ameletopsidae", code: "QE04*", color: "#107e7d", symbolizer: makeSymbolizer( 135, "#107e7d" ) },
    { name: "Coloburiscidae", ref: "adult_coloburiscidae", code: "QE05*", color: "#044b7f", symbolizer: makeSymbolizer( 180, "#044b7f" ) },
    { name: "Leptophlebiidae",ref: "adult_leptophlebiidae", code: "QE06*", color: "#f86624", symbolizer: makeSymbolizer( 225, "#f86624" ) },
    { name: "Caenidae", ref: "adult_caenidae_prosopistomatidae", code: "QE08*", color: "#5fad41", symbolizer: makeSymbolizer( 270, "#5fad41" ) },
    { name: "Prosopistomatidae", ref: "adult_caenidae_prosopistomatidae", code: "QE09*", color: "#3d2b3d", symbolizer: makeSymbolizer( 315, "#3d2b3d" ) },
];

const SLD = `<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd">
    <NamedLayer>
        <Name>wwew:tas_creatures</Name>
        <UserStyle>
            <Name>inline_style</Name>
            <FeatureTypeStyle>`
    + MAYFLY_LEGEND.map( ({ name, code, symbolizer }) => `
                <Rule> 
                    <Name>${name}</Name>
                    <ogc:Filter>
                        <ogc:PropertyIsLike  wildCard="*" singleChar="." escape="!">
                            <ogc:PropertyName>epa_code</ogc:PropertyName>
                            <ogc:Literal>${code}</ogc:Literal>
                        </ogc:PropertyIsLike>
                    </ogc:Filter>
                    <PointSymbolizer>${symbolizer}
                    </PointSymbolizer>
                </Rule>` ).join("") +`
            </FeatureTypeStyle>
        </UserStyle>
    </NamedLayer>
</StyledLayerDescriptor>`; 
console.log(SLD);