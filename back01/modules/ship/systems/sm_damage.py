from modules.physEngine.core import lBodyPool_Singleton
from modules.physEngine.world_constants import WorldPhysConstants
from modules.utils import Command

from modules.ship.systems.sm_core import BasicShipSystem, GlobalShipSystemController

from modules.ship.shipPool import ShipPool_Singleton
from modules.utils import Command
from modules.utils import Command, CommandQueue, ConfigLoader
from modules.physEngine.triggers.collector import TriggerQueue


import random


class DamageSystem(BasicShipSystem):
    def __init__(self, mark_id):
        super().__init__(mark_id, "damage_sm")
        # basic
        self.systems_hp = {}
        self.hp_level_step = 100
        self.system_names = ["engine_sm", "energy_sm", "radar_sm"]
        for sm_name in self.system_names:
            self.systems_hp[sm_name] = {
                'current_hp': self.hp_level_step,
                "max_hp": self.hp_level_step,
            }

        # energy overload
        energyoverlock_damage_per_sec = ConfigLoader().get("damage.energyoverlock_damage_per_sec", float)
        self.energyoverlock_damage_per_tick = WorldPhysConstants().get_onetick_step(energyoverlock_damage_per_sec, 1)
        self.overloaded = {}

        # taking damage marker
        self.is_taking_damage = False
        self.taking_damage_showoff_time = WorldPhysConstants().get_ticks_in_seconds(1)
        self.last_taking_damage_timestamp = WorldPhysConstants().current_frame()

    def inform_system_upgrade(self, system_name):
        self.systems_hp[system_name]["current_hp"] = 5

    def get_description(self):
        result = super().get_description()
        result["systems_hp"] = self.systems_hp
        return result

    def put_description(self, descr):
        super().put_description(descr)
        self.systems_hp = descr["systems_hp"]

    def inform_system_overload(self, system_name, power_overcome):
        self.overloaded[system_name] = power_overcome

    def inform_system_normalload(self, system_name):
        if system_name in self.overloaded:
            del self.overloaded[system_name]

    def next_step(self):
        super().next_step()
        # energy overload
        for system_name in self.overloaded:
            damage = self.energyoverlock_damage_per_tick * \
                self.overloaded[system_name]
            self.cause_damage2system(system_name, damage)

        # taking damage marker
        self.is_taking_damage = (WorldPhysConstants().current_frame() - self.last_taking_damage_timestamp) < \
            self.taking_damage_showoff_time

    def can_be_upgraded(self, system_name):
        return (self.systems_hp[system_name]["current_hp"]/self.systems_hp[system_name]["max_hp"]) > 0.9

    def cause_damage2system(self, system_name, damage):
        if system_name not in self.systems_hp:
            return

        self.systems_hp[system_name]['current_hp'] = self.systems_hp[system_name]['current_hp']-damage

        if self.systems_hp[system_name]['current_hp'] <= 0:
            self.systems_hp[system_name]['current_hp'] = 0

            if self.get_system("RnD_sm").get_upgrade_level(system_name) > 0:
                self.get_system("RnD_sm").downgrade_system(system_name)
                self.systems_hp[system_name]['current_hp'] = self.systems_hp[system_name]['max_hp']

    def get_status(self):
        status = super().get_status()
        status["systems_hp"] = self.systems_hp
        status["is_taking_damage"] = self.is_taking_damage
        return status

    def get_short_description(self):
        return "100/100"

    def proceed_command(self, command: Command):
        super().proceed_command(command)
        match command.get_action():
            case "takes_damage":
                self.takes_damage(command.get_params()[
                                  "damage_value"], command.get_params()["damage_type"])
            case 'repair_system_admin':
                system_name = command.get_params()["system"]
                self.systems_hp[system_name]['current_hp'] = self.systems_hp[system_name]['max_hp']

    def takes_damage(self, damage_value, damage_type='explosion', damage_source=None):
        self.last_taking_damage_timestamp = WorldPhysConstants().current_frame()

        targeted_system_name = "energy_sm"
        if damage_source:
            targeted_system_idx = abs(hash(damage_source)) % 5
            targeted_system_name = self.system_names[targeted_system_idx]
        else:
            targeted_system_name = random.choice(self.system_names)

        match damage_type:
            case "explosion":
                # system_name = random.choice(list(self.systems_hp.keys()))
                self.cause_damage2system(targeted_system_name, damage_value)
            case "emp":
                self.get_system("energy_sm").takes_emp_damage(
                    damage_value, ConfigLoader().get("damage.emp_duration", float))

            case 'collision':
                system_name = random.choice(list(self.systems_hp.keys()))
                modulo = damage_value % 1
                for i in range(int(damage_value)):
                    self.cause_damage2system(system_name, 1)
                self.cause_damage2system(system_name, modulo)

            case "radiation":
                system_name = random.choice(list(self.systems_hp.keys()))
                self.cause_damage2system(system_name, damage_value)


class NPC_DamageSystem(BasicShipSystem):

    def __init__(self, mark_id):
        super().__init__(mark_id, "damage_sm")
        self.total_max_hp = 125
        self.hp_state = {
            "total_hp": {
                'current_hp': self.total_max_hp,
                "max_hp": self.total_max_hp,
            }
        }
        # taking damage marker
        self.is_taking_damage = False
        self.taking_damage_showoff_time = WorldPhysConstants().get_ticks_in_seconds(1)
        self.last_taking_damage_timestamp = WorldPhysConstants().current_frame()

        self.hp_list = [125, 150, 200, 250]

    def next_step(self):
        super().next_step()
        # energy overload

        # taking damage marker
        self.is_taking_damage = (WorldPhysConstants().current_frame(
        )-self.last_taking_damage_timestamp) < self.taking_damage_showoff_time

    def set_hp(self, value):
        self.hp_state = {
            "total_hp": {
                'current_hp': value,
                "max_hp": value,
            }
        }

    def upgrade(self):
        super().upgrade()
        self.set_hp(self.hp_list[self.upgrade_level])

    def downgrade(self):
        super().downgrade()
        self.set_hp(self.hp_list[self.upgrade_level])

    def inform_system_overload(self, system_name, power_overcome):
        pass

    def inform_system_normalload(self, system_name):
        pass

    def get_short_description(self):
        max_hp = round(self.hp_state["total_hp"]["max_hp"], 2)
        curr_hp = self.hp_state["total_hp"]["current_hp"]
        return f"{curr_hp}/{max_hp}"

    def get_status(self):
        status = super().get_status()
        status["systems_hp"] = self.hp_state
        status["is_taking_damage"] = self.is_taking_damage
        return status

    def proceed_command(self, command: Command):
        super().proceed_command(command)
        params = command.get_params()
        match command.get_action():
            case "takes_damage":
                self.takes_damage(command.get_params()[
                                  "damage_value"], command.get_params()["damage_type"])

            case 'set_NPC_hp':
                self.hp_state["total_hp"]["current_hp"] = params["value"]
                self.hp_state["total_hp"]["max_hp"] = params["value"]

    def takes_damage(self, damage_value, damage_type='explosion', damage_source=None):
        self.last_taking_damage_timestamp = WorldPhysConstants().current_frame()
        match damage_type:
            case "explosion":
                self.hp_state["total_hp"]["current_hp"] = self.hp_state["total_hp"]["current_hp"]-damage_value
            case "emp":
                self.get_system("energy_sm").takes_emp_damage(
                    damage_value, ConfigLoader().get("damage.emp_duration", float))
            case 'collision':
                self.hp_state["total_hp"]["current_hp"] = self.hp_state["total_hp"]["current_hp"]-damage_value
            case "radiation":
                self.hp_state["total_hp"]["current_hp"] = self.hp_state["total_hp"]["current_hp"]-damage_value

        if self.hp_state["total_hp"]["current_hp"] <= 0:
            TriggerQueue().add("ship_defeat", self.mark_id, {})
