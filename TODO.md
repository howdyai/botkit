
 * can adapters spawn derived descendants of the botworker? that way they can expose more specific methods via intellisense?
   -> seems good and lots of benefits for typescript devs
   -> but introduce a cross-dependency on botkit that is kind of awkward. what if they are different versions?


 * Can we refactor controller to be a big master plan that runs itself? then you can do controller.hears OR controller.addPlan(new plan())!
    -> if we do this, it will be very difficult for outside developers to build against it until planning is published (otherwise they have to build botbuilder from source from a special branch)

