import type * as hb from "homebridge";
import * as miio from "miio-api";

import { BaseHumidifier } from "../humidifier";
import { Protocol, MiioProtocol } from "../protocols";
import { PlatformAccessory, DeviceOptions } from "../../platform";

enum Gear {
  Off = -1,
  Low = 1,
  Medium = 2,
  High = 3,
  Humidity = 4,
}

enum State {
  Off = 0,
  On = 1,
}

type Props = {
  OnOff_State: State;
  TemperatureValue: number;
  Humidity_Value: number;
  HumiSet_Value: number;
  Humidifier_Gear: Gear;
  Led_State: State;
  TipSound_State: State;
  waterstatus: State;
  watertankstatus: State;
};

export class DeermaHumidifierMJJSQ extends BaseHumidifier<Props> {
  protected getProtocol(device: miio.Device): Protocol<Props> {
    return new MiioProtocol(device);
  }

  configureAccessory(
    accessory: PlatformAccessory,
    api: hb.API,
    options: DeviceOptions,
  ): void {
    super.configureAccessory(accessory, api, options);
    const register = this.helper(accessory, api);

    register.currentState();
    register.targetState();
    register.active("OnOff_State", "Set_OnOff", {
      on: State.On,
      off: State.Off,
    });
    register.rotationSpeed("Humidifier_Gear", "Set_HumidifierGears", {
      modes: [Gear.Off, Gear.Low, Gear.Medium, Gear.High, Gear.Humidity],
    });
    register.humidity("Humidity_Value");
    register.humidityThreshold("HumiSet_Value", "Set_HumiValue", {
      beforeSet: async (_value, _characteristic, callback) => {
        // There is special mode for humidity threshold - Gear.Humidity,
        // so set mode to Gear.Humidity.
        try {
          await this.protocol.setProp(
            "HumiSet_Value",
            "Set_HumiValue",
            Gear.Humidity,
          );
        } catch (err) {
          callback(err);
          return true;
        }

        return false;
      },
    });
    register.waterLevel("waterstatus", { toChar: (it) => it * 100 });

    if (options.ledBulb?.enabled) {
      register.ledBulb("Led_State", "SetLedState", {
        name: options.ledBulb.name,
        modes: [State.Off, State.On],
        on: State.On,
        off: State.Off,
      });
    }

    if (options.buzzerSwitch?.enabled) {
      register.buzzerSwitch("TipSound_State", "SetTipSound_Status", {
        name: options.buzzerSwitch.name,
        on: State.On,
        off: State.Off,
      });
    }

    if (options.humiditySensor?.enabled) {
      register.humiditySensor("Humidity_Value", {
        name: options.humiditySensor.name,
      });
    }

    if (options.temperatureSensor?.enabled) {
      register.temperatureSensor("TemperatureValue", {
        name: options.temperatureSensor.name,
        toChar: (it) => it,
      });
    }
  }
}
