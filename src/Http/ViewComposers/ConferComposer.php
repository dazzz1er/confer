<?php

namespace DJB\Confer\Http\ViewComposers;

use Illuminate\Contracts\View\View;

use Session;

class ConferComposer {

    protected $conversations;
    protected $requested_conversations;

    /**
     * Create a new profile composer.
     *
     * @return void
     */
    public function __construct()
    {
        $this->conversations = Session::has('confer_conversations') ? Session::get('confer_conversations') : false;
        //$this->requested_conversations = Session::has('confer_requested_conversations') ? Session::get('confer_requested_conversations') : [];
    }

    /**
     * Bind data to the view.
     *
     * @param  View  $view
     * @return void
     */
    public function compose(View $view)
    {
        $view->with('confer_conversations', $this->conversations); //->with('confer_requested_conversations', $this->requested_conversations);
    }

}
